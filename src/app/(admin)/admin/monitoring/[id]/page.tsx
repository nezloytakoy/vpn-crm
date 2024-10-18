// "use client";

// import { useParams } from 'next/navigation';
// import React, { useEffect, useState } from 'react';

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
// }

// const UserPage: React.FC = () => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const params = useParams(); // Получаем параметры маршрута
//   const id = params?.id; // Получаем id пользователя из URL

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (!id) return; // Ждём загрузки параметра

//       try {
//         const response = await fetch(`/api/users/${id}`);
//         if (!response.ok) {
//           throw new Error('Ошибка при получении данных пользователя');
//         }
//         const data = await response.json();
//         setUser(data);
//         setLoading(false);
//       } catch (error) {
//         console.error('Ошибка при получении данных пользователя:', error);
//         setError('Не удалось загрузить данные пользователя.');
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [id]);

//   if (loading) {
//     return <p>Загрузка...</p>;
//   }

//   if (error) {
//     return <p>{error}</p>;
//   }

//   if (!user) {
//     return <p>Пользователь не найден</p>;
//   }

//   return (
//     <div>
//       <h1>Информация о пользователе</h1>
//       <p><strong>ID:</strong> {user.id}</p>
//       <p><strong>Имя:</strong> {user.name}</p>
//       <p><strong>Email:</strong> {user.email}</p>
//       <p><strong>Роль:</strong> {user.role}</p>
//     </div>
//   );
// };

// export default UserPage;

import styles from './Assistent.module.css'
import Link from 'next/link';

function Page() {
  return (
    <div className={styles.main}>
      <div className={styles.titlebox}>
        <h1 className={styles.title}>Ассистент</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>Мониторинг &nbsp;&nbsp;/&nbsp;&nbsp; <Link href="/admin/monitoring" className={styles.link}> Ассистент</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Page;