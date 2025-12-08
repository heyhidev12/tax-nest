import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DataRoom, DataRoomContent, DataRoomComment } from 'src/libs/entity/data-room.entity';

@Injectable()
export class DataRoomService {
  constructor(
    @InjectRepository(DataRoom)
    private readonly roomRepo: Repository<DataRoom>,
    @InjectRepository(DataRoomContent)
    private readonly contentRepo: Repository<DataRoomContent>,
    @InjectRepository(DataRoomComment)
    private readonly commentRepo: Repository<DataRoomComment>,
  ) {}

  // === DataRoom CRUD ===
  async createRoom(data: Partial<DataRoom>) {
    const room = this.roomRepo.create(data);
    return this.roomRepo.save(room);
  }

  async findAllRooms(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    return this.roomRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findRoomById(id: number) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException('자료실을 찾을 수 없습니다.');
    return room;
  }

  async updateRoom(id: number, data: Partial<DataRoom>) {
    const room = await this.findRoomById(id);
    Object.assign(room, data);
    return this.roomRepo.save(room);
  }

  async deleteRoom(id: number) {
    const room = await this.findRoomById(id);
    await this.roomRepo.remove(room);
    return { success: true };
  }

  // === Content CRUD ===
  async createContent(dataRoomId: number, data: Partial<DataRoomContent>) {
    await this.findRoomById(dataRoomId);
    const content = this.contentRepo.create({ dataRoomId, ...data });
    return this.contentRepo.save(content);
  }

  async findContents(dataRoomId: number, page = 1, limit = 20, includeHidden = false) {
    const where: any = { dataRoomId };
    if (!includeHidden) where.isExposed = true;

    const [items, total] = await this.contentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findContentById(id: number) {
    const content = await this.contentRepo.findOne({ 
      where: { id },
      relations: ['comments'],
    });
    if (!content) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    return content;
  }

  async updateContent(id: number, data: Partial<DataRoomContent>) {
    const content = await this.findContentById(id);
    Object.assign(content, data);
    return this.contentRepo.save(content);
  }

  async deleteContent(id: number) {
    const content = await this.findContentById(id);
    await this.contentRepo.remove(content);
    return { success: true };
  }

  async deleteContents(ids: number[]) {
    const contents = await this.contentRepo.find({ where: { id: In(ids) } });
    if (!contents.length) return { success: true, deleted: 0 };
    await this.contentRepo.remove(contents);
    return { success: true, deleted: contents.length };
  }

  async incrementViewCount(id: number) {
    await this.contentRepo.increment({ id }, 'viewCount', 1);
    return { success: true };
  }

  // === Comment CRUD ===
  async createComment(contentId: number, data: Partial<DataRoomComment>) {
    await this.findContentById(contentId);
    const comment = this.commentRepo.create({ contentId, ...data });
    return this.commentRepo.save(comment);
  }

  async findComments(contentId: number) {
    return this.commentRepo.find({
      where: { contentId, isHidden: false },
      order: { createdAt: 'ASC' },
    });
  }

  async hideComment(id: number) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    comment.isHidden = true;
    await this.commentRepo.save(comment);
    return { success: true };
  }

  async deleteComment(id: number) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    await this.commentRepo.remove(comment);
    return { success: true };
  }

  async reportComment(id: number) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    comment.isReported = true;
    await this.commentRepo.save(comment);
    return { success: true };
  }
}


