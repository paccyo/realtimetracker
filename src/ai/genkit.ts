import { useState } from "react";

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ "AIzaSyCtrWWaKm1h6W9yDJmRTIpbQHhbgNTBi6A" });


export default async function GeminiPromptForm(context: any) {

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
    `
    以下の条件に基づき、クーポン提案をしてください。

    ■ 目的：
    混雑している場所の近くにある、比較的空いている店舗を探し、ユーザーにクーポンを提案すること。

    ■ 入力情報（例）：
    - 混雑エリア（混雑している場所）の座標（例）：35.681236, 139.767125
    - 店舗一覧（店舗ID、名前、座標、混雑しているかどうか）：

    ■ 出力情報
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

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

  return reply;
};
