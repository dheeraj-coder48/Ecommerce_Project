import { ClerkProvider, SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <ClerkProvider>
      <main className="flex min-h-screen items-center justify-center bg-[#f1efe9] p-4">
        <SignIn />
      </main>
    </ClerkProvider>
  );
}
