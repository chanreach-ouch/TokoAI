# TokoAI API Testing Tutorial

This guide provides step-by-step instructions on how to test the core features of the TokoAI backend using the FastAPI Swagger UI.

## Prerequisites
1. Ensure your backend is running (`docker-compose up -d`).
2. Open your browser and navigate to the Swagger UI: **http://localhost:8000/docs**
3. Open a terminal window and stream the background worker logs so you can see the AI's chat replies live:
   ```bash
   docker logs tokoai-worker-1 -f
   ```

---

## Step 1: Create a Seller Shop
This step registers a new seller account, creates a unique `shop_id`, and saves their TikTok Access Token and Bakong Payment ID.

1. In Swagger UI, expand the green **`POST /api/v1/seller/shop`** endpoint.
2. Click **Try it out**.
3. In the **Request body** box, paste the following JSON:
```json
{
  "tiktok_page_id": "my_new_tiktok_page",
  "name": "Chanreach Tech Store",
  "bakong_merchant_id": "chanreach@abaa",
  "tiktok_access_token": "token_12345"
}
```
4. Click **Execute**.
5. Look at the `Server response`. You will receive a `shop_id` (a long UUID string like `ee5132df...`). **Copy this `shop_id`**, you will need it for Step 2!

---

## Step 2: Upload a Product Photo (AI Auto-Enrichment)
This step uploads a product photo. Gemini Vision will analyze it, write a Khmer/English description, generate search keywords, and save it to the vector database.

1. Expand the green **`POST /api/v1/seller/products/upload`** endpoint.
2. Click **Try it out**.
3. Fill out the form fields:
   * **`shop_id`**: Paste the UUID you copied from Step 1.
   * **`name`**: `AirPods Pro` *(or the name of your product)*
   * **`price_usd`**: `250`
   * **`stock_qty`**: `10`
   * **`sku`**: `AP-PRO-1`
   * **`file`**: Click "Choose File" and upload a product picture.
4. Click **Execute**.
5. Look at the `Server response`. You will see the AI's generated description and search aliases (`aliases_generated`).

---

## Step 3: Test the AI Chatbot (TikTok Webhook)
This step simulates a customer messaging your TikTok page. The message is processed in the background by the Redis worker.

1. Expand the green **`POST /api/v1/tiktok/webhook`** endpoint.
2. Click **Try it out**.
3. In the **`x-tiktok-signature`** box, type exactly: `dev` *(This enables the Developer Bypass for testing)*.
4. In the **Request body** box, paste the following JSON payload:
```json
{
  "message_id": "test_msg_999",
  "sender_id": "buyer_123",
  "recipient_id": "my_new_tiktok_page",
  "text": "Hello! Do you have the AirPods Pro in stock? I want to buy them."
}
```
*(Notice how the `recipient_id` matches the `tiktok_page_id` from Step 1!)*
5. Click **Execute**.
6. The Swagger UI will instantly return `{"status": "ok"}`. 
7. **To see the AI's reply:** Look at your open terminal window running the `docker logs` command. You will see a giant box pop up showing the AI's generated reply and Bakong payment link!

```text
==================================================
🤖 AI REPLY GENERATED:
ជំរាបសួរ! ចាស៎ បង AirPods Pro មានក្នុងស្តុកធម្មតា។
[បង់លុយទីនេះ - Pay $250 Here](https://checkout.tokoai.com/pay?shop_id=ee5132df...&amount=250)
==================================================
```
