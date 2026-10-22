# ランキングAPI(Cloudflare Workers + D1、無料枠)

## 公開手順
Cloudflareの無料アカウントが要ります(カード登録は不要です)。

```sh
cd worker
npx wrangler login
npx wrangler d1 create hitasura-pedal      # 出てきた database_id を wrangler.toml に書く
npx wrangler d1 execute hitasura-pedal --remote --file=schema.sql
npx wrangler deploy                        # 出てきた https://….workers.dev をメモ
```

そのあと、`index.html` の `RANK_URL` を `https://<メモしたURL>/scores` にします。
ゲームを公開したら、`wrangler.toml` の `ALLOWED_ORIGIN` を公開先のオリジンに絞ってください。

## 仕様
- `GET /scores` : 上位10件 `[{name, m}]`
- `POST /scores` : `{name, m, top}`。名前は8文字まで、距離は1〜20000m、最高速度は0〜90km/h
- 保存するのは上位100件だけです

## 注意
距離はブラウザから送られるので、偽の値は防げません。気になるときは、Cloudflareの
Rate Limiting ルールを足す、または登録を一人1日数回に絞ってください。
