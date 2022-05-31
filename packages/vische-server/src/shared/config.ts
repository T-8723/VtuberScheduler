import { Injectable } from '@nestjs/common';

@Injectable({})
export class Config {
  // 実際に使う場合は環境変数から値を読むように変更する
  apiKey = 'aaaaaaaaaaaaaaaaaaaa';
}
