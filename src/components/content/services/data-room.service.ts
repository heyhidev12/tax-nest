import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DataRoom, DataRoomContent, DataRoomComment, DataRoomType } from 'src/libs/entity/data-room.entity';

interface DataRoomListOptions {
  search?: string;
  exposureType?: DataRoomType;
  boardType?: string;
  isExposed?: boolean;
  enableComments?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

interface ContentListOptions {
  search?: string;
  categoryName?: string;
  isExposed?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

interface ConceptContentListOptions {
  search?: string;
  categoryName?: string;
  boardType?: string;
  isExposed?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

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

  async findAllRooms(options: DataRoomListOptions = {}) {
    const {
      search,
      exposureType,
      boardType,
      isExposed,
      enableComments,
      sort = 'latest',
      page = 1,
      limit = 20,
      includeHidden = false,
    } = options;

    const qb = this.roomRepo.createQueryBuilder('room')
      .leftJoinAndSelect('room.contents', 'contents');

    if (!includeHidden) {
      qb.andWhere('room.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('room.isExposed = :isExposed', { isExposed });
    }

    if (exposureType) {
      qb.andWhere('room.exposureType = :exposureType', { exposureType });
    }

    if (boardType) {
      qb.andWhere('room.boardType = :boardType', { boardType });
    }

    if (enableComments !== undefined) {
      qb.andWhere('room.enableComments = :enableComments', { enableComments });
    }

    // 자료실명 검색
    if (search) {
      qb.andWhere('room.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬 (기본: 최신순)
    qb.orderBy('room.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name,
      boardType: item.boardType,
      boardTypeLabel: this.getBoardTypeLabel(item.boardType),
      exposureType: item.exposureType,
      exposureTypeLabel: this.getExposureTypeLabel(item.exposureType),
      enableComments: item.enableComments,
      commentsLabel: item.enableComments ? 'Y' : 'N',
      isExposed: item.isExposed,
      exposedLabel: item.isExposed ? 'Y' : 'N',
      contentCount: item.contents?.length || 0,
      createdAt: item.createdAt,
      createdAtFormatted: this.formatDateTime(item.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findRoomById(id: number) {
    const room = await this.roomRepo.findOne({ 
      where: { id },
      relations: ['contents'],
    });
    if (!room) throw new NotFoundException('자료실을 찾을 수 없습니다.');
    
    return {
      ...room,
      boardTypeLabel: this.getBoardTypeLabel(room.boardType),
      exposureTypeLabel: this.getExposureTypeLabel(room.exposureType),
      commentsLabel: room.enableComments ? 'Y' : 'N',
      exposedLabel: room.isExposed ? 'Y' : 'N',
      contentCount: room.contents?.length || 0,
      createdAtFormatted: this.formatDateTime(room.createdAt),
      updatedAtFormatted: this.formatDateTime(room.updatedAt),
    };
  }

  async updateRoom(id: number, data: Partial<DataRoom>) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException('자료실을 찾을 수 없습니다.');
    Object.assign(room, data);
    return this.roomRepo.save(room);
  }

  async deleteRoom(id: number) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException('자료실을 찾을 수 없습니다.');
    await this.roomRepo.remove(room);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteRooms(ids: number[]) {
    const rooms = await this.roomRepo.find({ where: { id: In(ids) } });
    if (!rooms.length) return { success: true, deleted: 0 };
    await this.roomRepo.remove(rooms);
    return { success: true, deleted: rooms.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleRoomExposure(id: number) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException('자료실을 찾을 수 없습니다.');
    room.isExposed = !room.isExposed;
    await this.roomRepo.save(room);
    return { success: true, isExposed: room.isExposed, exposedLabel: room.isExposed ? 'Y' : 'N' };
  }

  // === Content CRUD ===
  async createContent(dataRoomId: number, data: Partial<DataRoomContent>) {
    await this.findRoomById(dataRoomId);
    const content = this.contentRepo.create({ dataRoomId, ...data });
    return this.contentRepo.save(content);
  }

  // Find all contents from all exposed data rooms/categories (for concepts)
  // Categories and Data Rooms are unified - categories ARE data rooms
  async findAllConceptContents(options: ConceptContentListOptions = {}) {
    const {
      search,
      categoryName,
      boardType,
      isExposed,
      sort = 'latest',
      page = 1,
      limit = 20,
      includeHidden = false,
    } = options;

    const qb = this.contentRepo.createQueryBuilder('content')
      .leftJoinAndSelect('content.dataRoom', 'dataRoom')
      .leftJoinAndSelect('content.comments', 'comments');

    // Only from exposed data rooms
    qb.andWhere('dataRoom.isExposed = :roomExposed', { roomExposed: true });

    if (!includeHidden) {
      qb.andWhere('content.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('content.isExposed = :isExposed', { isExposed });
    }

    // Filter by boardType (갤러리, 스니펫, 게시판)
    if (boardType) {
      qb.andWhere('dataRoom.boardType = :boardType', { boardType });
    }

    if (categoryName) {
      qb.andWhere('content.categoryName = :categoryName', { categoryName });
    }

    // 콘텐츠명 검색
    if (search) {
      qb.andWhere('content.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    qb.orderBy('content.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName || '-',
      authorName: item.authorName || '-',
      attachmentUrl: item.attachmentUrl,
      viewCount: item.viewCount,
      commentCount: item.comments?.length || 0,
      isExposed: item.isExposed,
      exposedLabel: item.isExposed ? 'Y' : 'N',
      boardType: item.dataRoom?.boardType,
      dataRoomId: item.dataRoomId,
      dataRoomName: item.dataRoom?.name,
      createdAt: item.createdAt,
      createdAtFormatted: this.formatDateTime(item.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findContents(dataRoomId: number, options: ContentListOptions = {}) {
    const {
      search,
      categoryName,
      isExposed,
      sort = 'latest',
      page = 1,
      limit = 20,
      includeHidden = false,
    } = options;

    const qb = this.contentRepo.createQueryBuilder('content')
      .leftJoinAndSelect('content.comments', 'comments')
      .where('content.dataRoomId = :dataRoomId', { dataRoomId });

    if (!includeHidden) {
      qb.andWhere('content.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('content.isExposed = :isExposed', { isExposed });
    }

    if (categoryName) {
      qb.andWhere('content.categoryName = :categoryName', { categoryName });
    }

    // 콘텐츠명 검색
    if (search) {
      qb.andWhere('content.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    qb.orderBy('content.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName || '-',
      authorName: item.authorName || '-',
      attachmentUrl: item.attachmentUrl,
      viewCount: item.viewCount,
      commentCount: item.comments?.length || 0,
      isExposed: item.isExposed,
      exposedLabel: item.isExposed ? 'Y' : 'N',
      createdAt: item.createdAt,
      createdAtFormatted: this.formatDateTime(item.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findContentById(id: number) {
    const content = await this.contentRepo.findOne({
      where: { id },
      relations: ['dataRoom', 'comments'],
    });
    if (!content) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    
    return {
      ...content,
      exposedLabel: content.isExposed ? 'Y' : 'N',
      commentCount: content.comments?.length || 0,
      createdAtFormatted: this.formatDateTime(content.createdAt),
      updatedAtFormatted: this.formatDateTime(content.updatedAt),
    };
  }

  async updateContent(id: number, data: Partial<DataRoomContent>) {
    const content = await this.contentRepo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    Object.assign(content, data);
    return this.contentRepo.save(content);
  }

  async deleteContent(id: number) {
    const content = await this.contentRepo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    await this.contentRepo.remove(content);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteContents(ids: number[]) {
    const contents = await this.contentRepo.find({ where: { id: In(ids) } });
    if (!contents.length) return { success: true, deleted: 0 };
    await this.contentRepo.remove(contents);
    return { success: true, deleted: contents.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleContentExposure(id: number) {
    const content = await this.contentRepo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    content.isExposed = !content.isExposed;
    await this.contentRepo.save(content);
    return { success: true, isExposed: content.isExposed, exposedLabel: content.isExposed ? 'Y' : 'N' };
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
    return { success: true, message: '댓글이 숨김 처리되었습니다.' };
  }

  async deleteComment(id: number) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    await this.commentRepo.remove(comment);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async reportComment(id: number) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    comment.isReported = true;
    await this.commentRepo.save(comment);
    return { success: true };
  }

  // === Report List (신고된 댓글 목록) ===
  async findReportedComments(page = 1, limit = 20) {
    const qb = this.commentRepo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.content', 'content')
      .where('comment.isReported = :isReported', { isReported: true })
      .andWhere('comment.isHidden = :isHidden', { isHidden: false })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      contentId: item.contentId,
      contentName: item.content?.name || '-',
      body: item.body,
      bodyPreview: item.body.length > 50 ? item.body.slice(0, 50) + '...' : item.body,
      authorName: item.authorName || '-',
      memberId: item.memberId,
      isReported: item.isReported,
      isHidden: item.isHidden,
      createdAt: item.createdAt,
      createdAtFormatted: this.formatDateTime(item.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  // === Label Helpers ===
  private getBoardTypeLabel(boardType: string): string {
    if (!boardType) return '-';
    switch (boardType.toLowerCase()) {
      case 'gallery':
        return '갤러리';
      case 'snippet':
        return '스니펫';
      case 'bulletin board':
      case 'bulletinboard':
        return '게시판';
      default:
        return boardType;
    }
  }

  private getExposureTypeLabel(exposureType: DataRoomType): string {
    switch (exposureType) {
      case DataRoomType.ALL:
        return '전체';
      case DataRoomType.GENERAL:
        return '일반';
      case DataRoomType.INSURANCE:
        return '보험사';
      case DataRoomType.OTHER:
        return '기타';
      default:
        return '전체';
    }
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
