import React from 'react';
import Wave from 'react-wavify';
import styles from './referal.module.css'
import Image from 'next/image';


function page() {
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
                    style={{ position: 'absolute', bottom: '-70px', width: '100%' }}
                />
                <div className={styles.topbotom}>
                    <div className={styles.greetings}>
                        Рефералы
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
                <div className={styles.infobox}>
                    <div className={styles.first}>
                        <div className={styles.firstone}>
                            <div className={styles.imgbox}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/6oj028KO84eNmPGxQv%20(1)%20(1)-i0oy2JG3MdnKbKy6h46dOwiUyPIwrF.gif"
                                    alt="avatar"
                                    width={60}
                                    height={60}
                                    className={styles.ai}
                                />
                            </div>
                            <div className={styles.textbox}>
                                <p className={styles.num}>20$</p>
                                <p className={styles.text}>Бонусы</p>
                            </div>
                        </div>
                        <div className={styles.firstone}>
                            <div className={styles.imgbox}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/9JY5i2T09d5oy2e62y-gcOJX1nhOJYe2s3RSXvGzQV4g9mH7t.gif"
                                    alt="avatar"
                                    width={130}
                                    height={130}
                                    className={styles.ai}
                                />
                            </div>
                            <div className={styles.textbox}>
                                <p className={styles.num}>10$</p>
                                <p className={styles.text}>Доступно</p>
                            </div>
                        </div>
                        <div className={styles.firstone}>
                            <div className={styles.imgbox}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/8c6L0g2Bl3CW1844BR-pLPUnTBWwuagzbZjfGSQToP9RP23nm.gif"
                                    alt="avatar"
                                    width={80}
                                    height={80}
                                    className={styles.ai}
                                />
                            </div>
                            <div className={styles.textbox}>
                                <p className={styles.num}>2</p>
                                <p className={styles.text}>Приглашено</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.buttonsContainer}>
                        <div className={styles.button}>Сгенерировать ссылку</div>
                        <div className={styles.button}>Вывести</div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default page