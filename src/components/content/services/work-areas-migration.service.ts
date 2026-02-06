import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TaxMember } from 'src/libs/entity/tax-member.entity';
import { MemberWorkCategory } from 'src/libs/entity/member-work-category.entity';
import { BusinessAreaCategory } from 'src/libs/entity/business-area-category.entity';

interface LegacyWorkArea {
  id: number;
  value: string;
}

export interface MigrationResult {
  success: boolean;
  totalMembers: number;
  membersWithWorkAreas: number;
  membersAlreadyMigrated: number;
  membersMigrated: number;
  totalMappingsCreated: number;
  errors: Array<{ memberId: number; error: string }>;
  details: Array<{
    memberId: number;
    memberName: string;
    status: 'migrated' | 'skipped' | 'error';
    mappingsCreated: number;
    message: string;
  }>;
}

export interface ValidationResult {
  success: boolean;
  totalMembers: number;
  membersWithLegacyData: number;
  membersWithNewData: number;
  membersFullyMigrated: number;
  membersPartiallyMigrated: number;
  membersNotMigrated: number;
  invalidCategoryIds: Array<{ memberId: number; categoryId: number }>;
  details: Array<{
    memberId: number;
    memberName: string;
    legacyCount: number;
    newCount: number;
    status: 'fully_migrated' | 'partially_migrated' | 'not_migrated' | 'no_legacy_data';
  }>;
}

@Injectable()
export class WorkAreasMigrationService {
  private readonly logger = new Logger(WorkAreasMigrationService.name);

  constructor(
    @InjectRepository(TaxMember)
    private readonly memberRepo: Repository<TaxMember>,
    @InjectRepository(MemberWorkCategory)
    private readonly memberWorkCategoryRepo: Repository<MemberWorkCategory>,
    @InjectRepository(BusinessAreaCategory)
    private readonly categoryRepo: Repository<BusinessAreaCategory>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Migrate legacy workAreas data to member_work_categories table
   * Safe to run multiple times - will skip already migrated members
   */
  async migrate(dryRun = false): Promise<MigrationResult> {
    this.logger.log(`Starting workAreas migration (dryRun: ${dryRun})`);

    const result: MigrationResult = {
      success: true,
      totalMembers: 0,
      membersWithWorkAreas: 0,
      membersAlreadyMigrated: 0,
      membersMigrated: 0,
      totalMappingsCreated: 0,
      errors: [],
      details: [],
    };

    try {
      // Get all members with their legacy workAreas (explicitly select the column)
      const members = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('tax_members', 'member')
        .getRawMany();

      result.totalMembers = members.length;
      this.logger.log(`Found ${members.length} total members`);

      // Get all valid category IDs for validation
      const validCategories = await this.categoryRepo.find({ select: ['id', 'name'] });
      const validCategoryIds = new Set(validCategories.map(c => c.id));
      const categoryNameMap = new Map(validCategories.map(c => [c.id, c.name]));

      for (const member of members) {
        const memberId = member.id;
        const memberName = member.name;
        let workAreas: LegacyWorkArea[] = [];

        // Parse workAreas JSON
        try {
          const rawWorkAreas = member.workAreas;
          if (rawWorkAreas) {
            const parsed = typeof rawWorkAreas === 'string' 
              ? JSON.parse(rawWorkAreas) 
              : rawWorkAreas;
            
            // Handle different formats
            if (Array.isArray(parsed)) {
              workAreas = parsed.map((item: any) => {
                // Format: { id: number, value: string }
                if (typeof item === 'object' && item.id !== undefined) {
                  return { id: Number(item.id), value: String(item.value || '') };
                }
                // Format: string (category ID as string)
                if (typeof item === 'string') {
                  const id = parseInt(item, 10);
                  if (!isNaN(id)) {
                    return { id, value: categoryNameMap.get(id) || '' };
                  }
                }
                // Format: number
                if (typeof item === 'number') {
                  return { id: item, value: categoryNameMap.get(item) || '' };
                }
                return null;
              }).filter((item): item is LegacyWorkArea => item !== null);
            }
          }
        } catch (parseError) {
          this.logger.warn(`Failed to parse workAreas for member ${memberId}: ${parseError}`);
          result.details.push({
            memberId,
            memberName,
            status: 'error',
            mappingsCreated: 0,
            message: `Failed to parse workAreas: ${parseError}`,
          });
          result.errors.push({ memberId, error: `Parse error: ${parseError}` });
          continue;
        }

        // Skip if no workAreas
        if (workAreas.length === 0) {
          result.details.push({
            memberId,
            memberName,
            status: 'skipped',
            mappingsCreated: 0,
            message: 'No legacy workAreas data',
          });
          continue;
        }

        result.membersWithWorkAreas++;

        // Check if already migrated
        const existingMappings = await this.memberWorkCategoryRepo.count({
          where: { memberId },
        });

        if (existingMappings > 0) {
          result.membersAlreadyMigrated++;
          result.details.push({
            memberId,
            memberName,
            status: 'skipped',
            mappingsCreated: 0,
            message: `Already has ${existingMappings} category mappings`,
          });
          continue;
        }

        // Prepare mappings
        const mappingsToCreate: Array<{
          memberId: number;
          categoryId: number;
          displayOrder: number;
        }> = [];

        for (let i = 0; i < workAreas.length; i++) {
          const workArea = workAreas[i];
          const categoryId = workArea.id;
          const displayOrder = i + 1; // 1-based

          // Validate category exists
          if (!validCategoryIds.has(categoryId)) {
            this.logger.warn(`Invalid categoryId ${categoryId} for member ${memberId}`);
            // Still create the mapping - category might be added later
          }

          // Check for duplicates within this member's workAreas
          const isDuplicate = mappingsToCreate.some(m => m.categoryId === categoryId);
          if (isDuplicate) {
            this.logger.warn(`Duplicate categoryId ${categoryId} in workAreas for member ${memberId}`);
            continue;
          }

          mappingsToCreate.push({
            memberId,
            categoryId,
            displayOrder,
          });
        }

        if (mappingsToCreate.length === 0) {
          result.details.push({
            memberId,
            memberName,
            status: 'skipped',
            mappingsCreated: 0,
            message: 'No valid mappings to create',
          });
          continue;
        }

        // Execute migration for this member
        if (!dryRun) {
          try {
            await this.dataSource.transaction(async (manager) => {
              const repo = manager.getRepository(MemberWorkCategory);
              for (const mapping of mappingsToCreate) {
                await repo.insert(mapping);
              }
            });

            result.membersMigrated++;
            result.totalMappingsCreated += mappingsToCreate.length;
            result.details.push({
              memberId,
              memberName,
              status: 'migrated',
              mappingsCreated: mappingsToCreate.length,
              message: `Created ${mappingsToCreate.length} mappings: ${mappingsToCreate.map(m => `cat:${m.categoryId}@order:${m.displayOrder}`).join(', ')}`,
            });
          } catch (insertError: any) {
            result.success = false;
            result.errors.push({ memberId, error: insertError.message });
            result.details.push({
              memberId,
              memberName,
              status: 'error',
              mappingsCreated: 0,
              message: `Insert failed: ${insertError.message}`,
            });
          }
        } else {
          // Dry run - just log what would happen
          result.membersMigrated++;
          result.totalMappingsCreated += mappingsToCreate.length;
          result.details.push({
            memberId,
            memberName,
            status: 'migrated',
            mappingsCreated: mappingsToCreate.length,
            message: `[DRY RUN] Would create ${mappingsToCreate.length} mappings: ${mappingsToCreate.map(m => `cat:${m.categoryId}@order:${m.displayOrder}`).join(', ')}`,
          });
        }
      }

      this.logger.log(`Migration ${dryRun ? '(dry run) ' : ''}complete: ${result.membersMigrated} members migrated, ${result.totalMappingsCreated} mappings created`);
      return result;
    } catch (error: any) {
      this.logger.error(`Migration failed: ${error.message}`);
      result.success = false;
      result.errors.push({ memberId: 0, error: error.message });
      return result;
    }
  }

  /**
   * Validate migration by comparing legacy workAreas with new member_work_categories
   */
  async validate(): Promise<ValidationResult> {
    this.logger.log('Starting migration validation');

    const result: ValidationResult = {
      success: true,
      totalMembers: 0,
      membersWithLegacyData: 0,
      membersWithNewData: 0,
      membersFullyMigrated: 0,
      membersPartiallyMigrated: 0,
      membersNotMigrated: 0,
      invalidCategoryIds: [],
      details: [],
    };

    try {
      // Get all valid category IDs
      const validCategories = await this.categoryRepo.find({ select: ['id'] });
      const validCategoryIds = new Set(validCategories.map(c => c.id));

      // Get all members with their legacy workAreas
      const members = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('tax_members', 'member')
        .getRawMany();

      result.totalMembers = members.length;

      // Get all member work categories
      const allMappings = await this.memberWorkCategoryRepo.find();
      const mappingsByMember = allMappings.reduce((acc, m) => {
        if (!acc[m.memberId]) acc[m.memberId] = [];
        acc[m.memberId].push(m);
        return acc;
      }, {} as Record<number, MemberWorkCategory[]>);

      for (const member of members) {
        const memberId = member.id;
        const memberName = member.name;
        let legacyCount = 0;

        // Parse legacy workAreas
        try {
          const rawWorkAreas = member.workAreas;
          if (rawWorkAreas) {
            const parsed = typeof rawWorkAreas === 'string' 
              ? JSON.parse(rawWorkAreas) 
              : rawWorkAreas;
            if (Array.isArray(parsed)) {
              legacyCount = parsed.length;
            }
          }
        } catch {
          // Ignore parse errors for validation
        }

        const newMappings = mappingsByMember[memberId] || [];
        const newCount = newMappings.length;

        if (legacyCount > 0) result.membersWithLegacyData++;
        if (newCount > 0) result.membersWithNewData++;

        // Check for invalid category IDs in new mappings
        for (const mapping of newMappings) {
          if (!validCategoryIds.has(mapping.categoryId)) {
            result.invalidCategoryIds.push({ memberId, categoryId: mapping.categoryId });
          }
        }

        // Determine status
        let status: 'fully_migrated' | 'partially_migrated' | 'not_migrated' | 'no_legacy_data';
        if (legacyCount === 0) {
          status = 'no_legacy_data';
        } else if (newCount === 0) {
          status = 'not_migrated';
          result.membersNotMigrated++;
          result.success = false;
        } else if (newCount >= legacyCount) {
          status = 'fully_migrated';
          result.membersFullyMigrated++;
        } else {
          status = 'partially_migrated';
          result.membersPartiallyMigrated++;
          result.success = false;
        }

        result.details.push({
          memberId,
          memberName,
          legacyCount,
          newCount,
          status,
        });
      }

      this.logger.log(`Validation complete: ${result.membersFullyMigrated} fully migrated, ${result.membersPartiallyMigrated} partially, ${result.membersNotMigrated} not migrated`);
      return result;
    } catch (error: any) {
      this.logger.error(`Validation failed: ${error.message}`);
      result.success = false;
      return result;
    }
  }

  /**
   * Get migration status summary
   */
  async getStatus(): Promise<{
    legacyDataExists: boolean;
    totalMembers: number;
    membersWithLegacyWorkAreas: number;
    membersWithNewCategories: number;
    totalNewMappings: number;
    migrationNeeded: boolean;
  }> {
    // Check if workAreas column exists
    let legacyDataExists = false;
    let membersWithLegacyWorkAreas = 0;

    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM tax_members WHERE workAreas IS NOT NULL AND workAreas != '[]' AND workAreas != 'null'`
      );
      membersWithLegacyWorkAreas = parseInt(result[0]?.count || '0', 10);
      legacyDataExists = membersWithLegacyWorkAreas > 0;
    } catch {
      // Column might not exist
      legacyDataExists = false;
    }

    const totalMembers = await this.memberRepo.count();
    const membersWithNewCategories = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT memberId)', 'count')
      .from('member_work_categories', 'mwc')
      .getRawOne()
      .then(r => parseInt(r?.count || '0', 10));

    const totalNewMappings = await this.memberWorkCategoryRepo.count();

    return {
      legacyDataExists,
      totalMembers,
      membersWithLegacyWorkAreas,
      membersWithNewCategories,
      totalNewMappings,
      migrationNeeded: legacyDataExists && membersWithLegacyWorkAreas > membersWithNewCategories,
    };
  }
}
