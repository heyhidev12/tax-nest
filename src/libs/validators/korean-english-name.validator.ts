import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 이름 검증: 최대 6자, 한글 또는 영문만 허용 (숫자 불가)
 * Name validation: Up to 6 characters, Korean or English only (numbers not allowed)
 */
@ValidatorConstraint({ async: false })
export class IsKoreanEnglishNameConstraint implements ValidatorConstraintInterface {
  validate(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // 1-6자, 한글/영문만 허용 (숫자, 특수문자 불가)
    const regex = /^[가-힣a-zA-Z]{1,6}$/;
    return regex.test(name);
  }

  defaultMessage(): string {
    return '이름은 최대 6자의 한글 또는 영문만 입력 가능합니다. (숫자 불가)';
  }
}

export function IsKoreanEnglishName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsKoreanEnglishNameConstraint,
    });
  };
}
