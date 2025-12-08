import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 비밀번호 검증: 영문, 숫자, 특수문자 중 2가지 이상 조합
 * Password validation: At least 2 of the following: English letters, numbers, special characters
 */
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    let criteriaCount = 0;

    // 영문자 포함
    if (/[a-zA-Z]/.test(password)) {
      criteriaCount++;
    }

    // 숫자 포함
    if (/[0-9]/.test(password)) {
      criteriaCount++;
    }

    // 특수문자 포함
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      criteriaCount++;
    }

    return criteriaCount >= 2;
  }

  defaultMessage(): string {
    return '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상을 조합해야 합니다.';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
