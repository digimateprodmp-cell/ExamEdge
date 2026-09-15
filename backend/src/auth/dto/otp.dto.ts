import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class SendPhoneOtpDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'phone must be a 10 digit number' })
  phone!: string;
}

export class VerifyPhoneOtpDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}
