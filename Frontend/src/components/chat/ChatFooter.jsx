// Composer dock under an active conversation, with the accuracy disclaimer.
// The ::before gradient fades the conversation out behind it.
export default function ChatFooter({ composer }) {
  return (
    <div className="relative flex w-full flex-col items-center px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-7 before:bg-linear-to-b before:from-transparent before:to-main max-md:px-3">
      <div className="mb-[0.55rem] w-full max-w-[960px] max-lg:max-w-[720px]">{composer}</div>
      <div className="text-center text-xs text-secondary max-md:text-[0.7rem]">
        Databricks Genie can make mistakes. Check important info.
      </div>
    </div>
  );
}
