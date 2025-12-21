import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TaxMember } from 'src/libs/entity/tax-member.entity';
import { BusinessArea } from 'src/libs/entity/business-area.entity';

interface TaxMemberListOptions {
  search?: string; // Search by insurance company name (affiliation) or member name
  workArea?: string;
  businessAreaId?: number; // Filter by business area item ID (matches minorCategory.name)
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class TaxMemberService {
  constructor(
    @InjectRepository(TaxMember)
    private readonly memberRepo: Repository<TaxMember>,
    @InjectRepository(BusinessArea)
    private readonly businessAreaRepo: Repository<BusinessArea>,
  ) {}

  async create(data: Partial<TaxMember>) {
    const member = this.memberRepo.create(data);
    return this.memberRepo.save(member);
  }

  async findAll(options: TaxMemberListOptions = {}) {
    const { 
      search, 
      workArea,
      businessAreaId,
      isExposed,
      sort = 'order',
      page = 1, 
      limit = 20, 
      includeHidden = false 
    } = options;

    const qb = this.memberRepo.createQueryBuilder('member');

    // 조건들을 배열로 수집
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    // 노출 여부 필터 (includeHidden이 false면 노출된 것만, true면 isExposed 파라미터에 따라)
    if (!includeHidden) {
      conditions.push('member.isExposed = :isExposed');
      params.isExposed = true;
    } else if (isExposed !== undefined) {
      conditions.push('member.isExposed = :isExposed');
      params.isExposed = isExposed;
    }

    // 검색: 보험사명(소속명) 또는 구성원 명 (이미지 요구사항에 따라)
    if (search) {
      conditions.push('(member.name LIKE :search OR member.affiliation LIKE :search)');
      params.search = `%${search}%`;
    }

    // Filter by businessAreaId: Get the business area item, then filter by its minorCategory.name
    if (businessAreaId) {
      const businessArea = await this.businessAreaRepo.findOne({
        where: { id: businessAreaId },
        relations: ['minorCategory'],
      });
      
      if (!businessArea) {
        throw new NotFoundException('업무분야를 찾을 수 없습니다.');
      }

      const minorCategoryName = businessArea.minorCategory?.name;
      if (!minorCategoryName) {
        throw new NotFoundException('업무분야의 카테고리 정보를 찾을 수 없습니다.');
      }

      // Filter members where workAreas array contains the minorCategory.name
      // Using JSON_CONTAINS for MySQL/MariaDB compatibility
      conditions.push('JSON_CONTAINS(member.workAreas, :minorCategoryName)');
      params.minorCategoryName = JSON.stringify(minorCategoryName);
    }

    if (workArea) {
      conditions.push('JSON_CONTAINS(member.workAreas, :workArea)');
      params.workArea = JSON.stringify(workArea);
    }

    // 조건 적용
    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('member.displayOrder', 'ASC').addOrderBy('member.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('member.createdAt', 'DESC');
    } else {
      qb.orderBy('member.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 구성원 명, 구성원 메인 이미지, 소속 명, 업무 분야(1순위/2순위/3순위), 노출 여부, 등록일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 번호 계산: 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터, 순서순이면 큰 번호부터
      let no: number;
      if (sort === 'latest') {
        no = total - ((page - 1) * limit + index);
      } else if (sort === 'oldest') {
        no = (page - 1) * limit + index + 1;
      } else {
        // order sort: 큰 번호부터
        no = total - ((page - 1) * limit + index);
      }

      // 업무 분야를 1순위/2순위/3순위로 표시
      const workAreasArray = item.workAreas || [];
      const workArea1st = workAreasArray[0] || '';
      const workArea2nd = workAreasArray[1] || '';
      const workArea3rd = workAreasArray[2] || '';

      return {
        no,
        id: item.id,
        name: item.name,
        mainPhotoUrl: item.mainPhotoUrl,
        subPhotoUrl: item.subPhotoUrl,
        workAreas: item.workAreas || [],
        workArea1st,
        workArea2nd,
        workArea3rd,
        affiliation: item.affiliation || '-',
        phoneNumber: item.phoneNumber,
        email: item.email,
        vcardUrl: item.vcardUrl,
        pdfUrl: item.pdfUrl,
        oneLineIntro: item.oneLineIntro,
        expertIntro: item.expertIntro,
        mainCases: item.mainCases,
        education: item.education,
        careerAndAwards: item.careerAndAwards,
        booksActivitiesOther: item.booksActivitiesOther,
        displayOrder: item.displayOrder,
        isExposed: item.isExposed,
        exposedLabel: item.isExposed ? 'Y' : 'N',
        createdAt: item.createdAt,
        createdAtFormatted: this.formatDateTime(item.createdAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findById(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');
    
    return {
      ...member,
      exposedLabel: member.isExposed ? 'Y' : 'N',
      createdAtFormatted: this.formatDateTime(member.createdAt),
      updatedAtFormatted: this.formatDateTime(member.updatedAt),
    };
  }

  async update(id: number, data: Partial<TaxMember>) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');
    Object.assign(member, data);
    return this.memberRepo.save(member);
  }

  async delete(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');
    await this.memberRepo.remove(member);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const members = await this.memberRepo.find({ where: { id: In(ids) } });
    if (!members.length) return { success: true, deleted: 0 };
    await this.memberRepo.remove(members);
    return { success: true, deleted: members.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');
    member.isExposed = !member.isExposed;
    await this.memberRepo.save(member);
    return { success: true, isExposed: member.isExposed, exposedLabel: member.isExposed ? 'Y' : 'N' };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.memberRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  // 날짜 포맷 헬퍼 (yyyy.MM.dd HH:mm:ss)
  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  }
}
