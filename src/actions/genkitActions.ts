// import GeminiPromptForm from '@/ai/genkit';

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyCtrWWaKm1h6W9yDJmRTIpbQHhbgNTBi6A" });

export async function getCouponRecommendation(congestedAreas: any[], stores: any[]) {
  try {
    const context = JSON.stringify({ congestedAreas, stores }, null, 2);
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents:
        `
        以下の条件に基づき、クーポン提案をしてください。
    
        ■ 目的：
        混雑している場所から離れた場所にある、比較的空いている店舗を探し、ユーザーにクーポンを提案すること。提案するクーポンは複数ある店舗から一つだけ抜粋してください。
    
        ■ 前提情報：
        マップの範囲は縦横21*21（0~21）

        ■ 入力情報（例）：
        - 混雑エリア（混雑している場所）の座標（例）：35.681236, 139.767125
        - 店舗一覧（店舗ID、名前、座標、混雑しているかどうか）：
    
        ■ 出力情報：
        - 店舗ID
        - クーポンの割引率 (例：50%OFF)
        - クーポンタイトル（例：タイムセール！）
    
        ■ 入力context
        ${context}
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            store_id: Type.STRING,
            coupon_per: Type.STRING,
            title: Type.STRING,
          },
        },
      });
    
      const data = await response.text;
      console.log(data);
      // console.log(typeof data);
      const reply = data || "No response";

    return { success: true, response: reply };
  } catch (error: any) {
    console.error("Error in getCouponRecommendation server action:", error);
    return { success: false, error: error.message };
  }
}