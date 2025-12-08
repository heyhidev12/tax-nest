import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 로그인 ID 검증: 6-20자 영문/숫자만 허용 (특수문자 불가, 대소문자 구분)
 * Login ID validation: 6-20 characters, English letters or numbers only (no special characters, case sensitive)
 */
@ValidatorConstraint({ async: false })
export class IsValidLoginIdConstraint implements ValidatorConstraintInterface {
  validate(loginId: string): boolean {
    if (!loginId || typeof loginId !== 'string') {
      return false;
    }

    // 6-20자, 영문/숫자만 허용
    const regex = /^[a-zA-Z0-9]{6,20}$/;
    return regex.test(loginId);
  }

  defaultMessage(): string {
    return '로그인 ID는 6~20자의 영문 또는 숫자만 입력 가능합니다.';
  }
}

export function IsValidLoginId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidLoginIdConstraint,
    });
  };
}
