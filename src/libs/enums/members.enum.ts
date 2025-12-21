// src/libs/enums/member-type.enum.ts
export enum MemberType {
  GENERAL = 'GENERAL',       // 일반회원
  OTHER = 'OTHER',   // 기타
  INSURANCE = 'INSURANCE',   // 보험사 직원
}

export enum MemberFlag {
  MEMBER = 'MEMBER',
  NON_MEMBER = 'NON_MEMBER',
}


export enum MemberStatus {
  ACTIVE = 'ACTIVE',         // 이용중
  WITHDRAWN = 'WITHDRAWN',   // 탈퇴
}