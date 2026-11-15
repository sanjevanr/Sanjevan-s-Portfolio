# Sanjevan-s-Portfolio
Welcome to my GitHub repository showcasing a collection of my passion projects! 🚀 Here, you'll find a diverse range of endeavors that reflect my interests and skills. From coding experiments to creative ventures, each project is a labor of love. Explore, learn, and feel free to contribute or provide feedback. 

## Contact form deployment

The contact form posts to the Vercel Function in `api/contact.ts`. Configure `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` in Vercel's private project environment settings. `RESEND_API_KEY` is server-only and must not use a `VITE_` prefix. `.env.example` lists the variable names without values.

`onboarding@resend.dev` can be used for initial testing. Production email requires a sender address on a domain verified with Resend.
