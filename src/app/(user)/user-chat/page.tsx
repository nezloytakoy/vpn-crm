"use client"

import React, { useEffect } from 'react';
import styles from "./chat.module.css";
import Image from 'next/image';
import Wave from 'react-wavify';

function Page() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleAIClick = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      console.error('Telegram WebApp API недоступен.');
    }
  };

  return (
    <div>
      <div style={{ position: 'relative', height: '250px', overflow: 'hidden', border: '2px solid white' }}>
        <Wave
          fill="white"
          paused={false}
          options={{
            height: 10,
            amplitude: 20,
            speed: 0.15,
            points: 3,
          }}
          style={{ position: 'absolute', bottom: '-110px', width: '100%' }}
        />
        <div className={styles.topbotom}>
          <div className={styles.greetings}>
            Настройки чата
            <div className={styles.avatarbox}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                alt="avatar"
                width={110}
                height={110}
                className={styles.avatar}
              />
              <p className={styles.name}> John Doe </p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.backbotom}>
        <Image
          src="https://92eaarerohohicw5.public.blob.vercel-storage.com/996EqstBE4t1d8c9g6-jeb3NiaC2TKaaz5a471tlDVtQv8zVO.gif"
          alt="avatar"
          width={200}
          height={200}
        />
        <p className={styles.info}>В ДАННЫЙ МОМЕНТ ВЫ ИСПОЛЬЗУЕТЕ AI КАК АССИСТЕНТА. </p>
        <div className={styles.buttonblock}>
          <div className={styles.button}>
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/IA158yEgkfW3n1W5Q5%20(1)-KycQ0tzTzLRWMAHYkC04Ckf5fo3EPj.gif"
              alt="avatar"
              width={70}
              height={70}
              className={styles.ai}
            />
            <p className={styles.text}>Ассистент</p>
            <div className={styles.void}></div>
          </div>
          <div className={styles.selected} onClick={handleAIClick}>
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/86c7Op9pK1Dv395eiA%20(1)-hJvzVxfMVzlwNsJWvGfU0lcs4VekiT.gif"
              alt="avatar"
              width={70}
              height={70}
              className={styles.ai}
            />
            <p className={styles.text}>AI</p>
            <div className={styles.void}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
