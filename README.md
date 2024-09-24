# Welcome to Our Next.js Project!

Everything you need to build and scale a Next.js project, powered by [`create-next-app`](https://github.com/vercel/next.js).

## Getting Started

### Creating a Project

If you're reading this, you've likely already created your Next.js project. Congratulations! 🎉 If not, you can quickly create a new project:

1. To create a new project in the current directory, run `npx create-next-app@latest`.
2. To create a new project in a directory called 'my-app', run `npx create-next-app@latest my-app`.

## Developing

Once you've created a project and installed dependencies with npm install (or pnpm install or yarn install), you can start a development server:

1. To start the development server, run `npm run dev`.
2. To start the server and automatically open the app in a new browser tab, run `npm run dev -- --open`.

## Building for Production

To create a production version of your app:

1. Run `npm run build`.

2. To preview the production build, run `npm run start` after building.

> 💡 Depending on where you plan to deploy your app, you might need to install an appropriate adapter or platform service like [`Vercel`](https://vercel.com/), or other services.
>
> ## Features
> 
> Our project includes several key features:
> 
1. **User Management**: Includes user authentication, profile management, and role-based access control (user, support, admin).

2. **Request System**: Users can create requests, which are then automatically distributed among support staff and the AI system.

3. **Support Activity Monitoring**: Tracks and manages the activity of support staff, including request status and coin rewards.
   
4. **Subscription Management**: Users can manage their subscription plans, and pay using Telegram Stars and NicePay for seamless transactions.
   
5. **Referral System**: Users can invite others and earn referral bonuses.
   
6. **Flexible System Settings**: Admins can configure limits on requests, manage coins, and update subscription levels.

> ## Development Environment
>
> We are using the following stack:
>
> *  **Next.js**: For both frontend and backend.
> *  
> *  **PostgreSQL + Prisma**: For the database and ORM.
>
> *  **Telegram Bots**: To manage interactions for users, support staff, and administrators.
>
> *  **Authentication**: Managed through JWT using the jose library.
>
> *  **Payment Integration**: With Telegram Stars and NicePay for user payments and subscription handling.
