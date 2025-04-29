'use client';

import { Button, FileTrigger } from '@/core/components/ui';
import { Textarea } from '@/core/components/ui/textarea';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Icon } from '@iconify/react';
import { useAutoResizeTextarea } from '@workspace/core/hooks/use-auto-resize-textarea';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

function FileDisplay({
  fileName,
  onClear,
}: { fileName: string; onClear: () => void }) {
  return (
    <div className="group flex w-fit items-center gap-2 rounded-lg border bg-black/5 px-3 py-1 dark:border-white/10 dark:bg-white/5">
      <Icon icon="lucide:file-up" className="h-4 w-4 dark:text-white" />
      <span className="text-sm dark:text-white">{fileName}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
      >
        <Icon icon="lucide:x" className="h-3 w-3 dark:text-white" />
      </button>
    </div>
  );
}

export function ChatField({
  status,
  input,
  setInput,
  onSubmit,
  stop,
  disableSubmit = false,
  isAutoScroll,
}: Pick<UseChatHelpers, 'status' | 'input' | 'setInput' | 'stop'> & {
  onSubmit: (
    evt: { preventDefault: () => void },
    files: FileList | null
  ) => void;
  disableSubmit?: boolean;
  isAutoScroll: boolean;
}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 200,
  });

  const showStopButton = status === 'submitted' || status === 'streaming';
  const isDisabled =
    (!showStopButton && status !== 'ready') ||
    (input.trim() === '' && status === 'ready') ||
    disableSubmit;

  const handleSubmit = (evt: { preventDefault: () => void }) => {
    adjustHeight(true);
    onSubmit(evt, files);
    setFiles(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 flex flex-col gap-y-2 bg-(--color-bg) py-2"
    >
      {/* scroll-down button: show when user is not at bottom */}
      {!isAutoScroll && (
        <Button
          type="button"
          intent="outline"
          appearance="outline"
          size="square-petite"
          shape="circle"
          className="-top-10 -translate-x-1/2 absolute left-1/2 z-20"
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth',
            })
          }
        >
          <Icon icon="lucide:chevron-down" className="h-4 w-4" />
        </Button>
      )}

      <div className="flex gap-x-2">
        {files &&
          Array.from(files).map((file) => (
            <FileDisplay
              key={file.name}
              fileName={file.name}
              onClear={() => {
                const dt = new DataTransfer();
                for (const f of files) {
                  if (f.name !== file.name) {
                    dt.items.add(f);
                  }
                }
                setFiles(dt.files);
              }}
            />
          ))}
      </div>

      <div className="relative flex flex-col">
        <Textarea
          id="ai-input-04"
          value={input}
          placeholder="Ask anything..."
          className="w-full resize-none rounded-lg rounded-b-none border-none bg-black/5 p-3 leading-[1.2] placeholder:text-black/70 focus-visible:ring-0 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70"
          textAreaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          onChange={(value) => {
            setInput(value);
            adjustHeight();
          }}
        />

        <div className="h-12 rounded-b-xl bg-black/5 dark:bg-white/5">
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="cursor-pointer rounded-lg bg-black/5 dark:bg-white/5">
              <FileTrigger
                allowsMultiple
                size="small"
                acceptedFileTypes={[
                  'image/png',
                  'image/jpeg',
                  'image/jpg',
                  'image/webp',
                  'application/pdf',
                ]}
                onSelect={(filelist) => {
                  // don't allow input more than 2 files
                  if (filelist && filelist.length > 2) {
                    toast.error('You can only upload up to 2 files');
                    return;
                  }

                  setFiles(filelist);
                }}
              >
                Attachments
              </FileTrigger>
            </label>
            <button
              type="button"
              onClick={() => {
                setShowSearch(!showSearch);
              }}
              className={twMerge(
                'flex h-8 cursor-pointer items-center gap-2 rounded-full border px-1.5 py-1 transition-all',
                showSearch
                  ? 'border-sky-400 bg-sky-500/15 text-sky-500'
                  : 'border-transparent bg-black/5 text-black/40 hover:text-black dark:bg-white/5 dark:text-white/40 dark:hover:text-white '
              )}
            >
              <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                <motion.div
                  animate={{
                    rotate: showSearch ? 180 : 0,
                    scale: showSearch ? 1.1 : 1,
                  }}
                  whileHover={{
                    rotate: showSearch ? 180 : 15,
                    scale: 1.1,
                    transition: {
                      type: 'spring',
                      stiffness: 300,
                      damping: 10,
                    },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 25,
                  }}
                >
                  <Icon
                    icon="lucide:globe"
                    className={twMerge(
                      'h-4 w-4',
                      showSearch ? 'text-sky-500' : 'text-inherit'
                    )}
                  />
                </motion.div>
              </div>
              <AnimatePresence>
                {showSearch && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: 'auto',
                      opacity: 1,
                    }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 overflow-hidden whitespace-nowrap text-sky-500 text-sm"
                  >
                    Search
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="absolute right-3 bottom-3">
            <Button
              size="square-petite"
              type={showStopButton ? 'button' : 'submit'}
              isDisabled={isDisabled}
              onClick={() => {
                if (!showStopButton) {
                  return;
                }

                stop();
              }}
            >
              <Icon
                icon={showStopButton ? 'lucide:circle-stop' : 'lucide:send'}
                className="h-4 w-4"
              />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
