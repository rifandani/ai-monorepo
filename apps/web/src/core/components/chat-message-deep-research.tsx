'use client';

import { Markdown } from '@/core/components/markdown';
import { Modal } from '@/core/components/ui/modal';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import type { Research } from '@/core/services/ai';
import { Icon } from '@iconify/react';
import type { JSONValue, ToolInvocation } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatusUpdate {
  title: string;
  description?: string;
}

function formatElapsedTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function useElapsedTime(state: ToolInvocation['state']) {
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (state !== 'result') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, state]);

  return elapsedTime;
}

function DeepResearchStatus({
  updates,
}: {
  updates: StatusUpdate[];
}) {
  if (updates.length === 0) {
    return null;
  }

  const currentUpdate = updates.at(-1);

  return (
    <div className="relative mt-6 rounded-md bg-zinc-100 px-4 py-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentUpdate?.title}
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -20, rotateX: 90 }}
          transition={{
            duration: 0.3,
            ease: [0.645, 0.045, 0.355, 1.0],
          }}
          className="flex h-full w-full flex-col"
        >
          <p className="line-clamp-2 font-mono text-sm text-zinc-950 tracking-tight">
            {currentUpdate?.title}
          </p>
          {currentUpdate?.description && (
            <p className="px-4 py-2 font-mono text-xs text-zinc-950 tracking-tight">
              {currentUpdate.description}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function ChatMessageDeepResearch({
  toolInvocation,
  annotations,
}: {
  toolInvocation: ToolInvocation;
  annotations?: JSONValue[];
}) {
  const { state } = toolInvocation;
  const elapsedTime = useElapsedTime(state);

  const statusUpdates: StatusUpdate[] = (annotations ?? [])
    .filter(
      (
        annotation
      ): annotation is { status: { title: string; description?: string } } =>
        annotation !== null &&
        typeof annotation === 'object' &&
        'status' in annotation
    )
    .map((update) => update.status);

  const sourceUpdates = Array.from<{
    source: { title: string; url: string };
  }>(
    new Set(
      annotations?.filter(
        (
          annotation
        ): annotation is { source: { title: string; url: string } } =>
          annotation !== null &&
          typeof annotation === 'object' &&
          'source' in annotation
      )
    )
  );

  if (state === 'result') {
    const { result } = toolInvocation;
    const {
      report,
      research,
    }: { report: { content: string; title: string }; research: Research } =
      result;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-4 w-full max-w-xl rounded-2xl border border-zinc-200"
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon
                icon="mdi:file-document-outline"
                className="h-6 w-6 text-zinc-500"
              />
              <h2 className="font-semibold text-xl">Deep Research</h2>
            </div>
            <div className="pr-2 text-sm text-zinc-500">
              Completed in {formatElapsedTime(elapsedTime)}
            </div>
          </div>

          <Modal>
            <Modal.Trigger className="w-full">
              <motion.div className="mb-6 w-full cursor-pointer rounded-xl border border-zinc-200 p-4 text-left shadow-sm transition-colors hover:border-zinc-200 hover:bg-zinc-800">
                <h3 className="mb-2 font-semibold text-lg">{report.title}</h3>
                <div className="line-clamp-2 font-mono text-xs text-zinc-500">
                  {report.content?.slice(0, 250)}
                </div>
              </motion.div>
            </Modal.Trigger>
            <Modal.Content
              classNames={{ content: 'h-[85vh] overflow-y-auto max-w-4xl' }}
            >
              <Modal.Header>
                <Modal.Title className="flex items-center gap-2 pt-2 font-medium text-2xl tracking-tight">
                  <Icon
                    icon="mdi:file-document-outline"
                    className="h-5 w-5 text-zinc-400"
                  />
                  {report.title}
                </Modal.Title>
              </Modal.Header>
              <ScrollArea className="mt-4 h-full overflow-y-auto border-border border-t">
                <div className="prose prose-zinc flex max-w-none flex-col gap-y-2 px-4 py-2 prose-headings:font-normal prose-a:text-zinc-900 prose-a:transition-colors prose-a:duration-200 hover:prose-a:text-zinc-500">
                  <Markdown>{report.content}</Markdown>
                </div>
              </ScrollArea>
            </Modal.Content>
          </Modal>

          {research.sources && research.sources.length > 0 && (
            <Modal>
              <Modal.Trigger className="mx-2 cursor-pointer text-sm text-zinc-500 transition-colors hover:text-zinc-600">
                Deep Research used{' '}
                {Array.from(new Set(research.sources)).length} sources.
              </Modal.Trigger>
              <Modal.Content classNames={{ content: 'max-h-[75vh] max-w-3xl' }}>
                <Modal.Header>
                  <Modal.Title className="flex items-center gap-2 font-medium text-xl tracking-tight">
                    <Icon
                      icon="mdi:link-variant"
                      className="h-5 w-5 text-zinc-500"
                    />
                    Sources
                  </Modal.Title>
                </Modal.Header>
                <ScrollArea className="max-h-[65vh] overflow-y-auto p-4">
                  <p className="mb-4 text-sm text-zinc-600">
                    The following sources were used in the research:
                  </p>
                  <div className="space-y-2 text-sm text-zinc-600">
                    <AnimatePresence>
                      {Array.from(new Set(research.sources)).map(
                        (source, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="mb-4 rounded-lg border border-zinc-200 p-4"
                          >
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium transition-opacity hover:opacity-75"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {/* <img
                                  src={source.favicon}
                                  alt="Favicon"
                                  className="h-4 w-4 rounded-full"
                                /> */}
                                {source.title}
                              </div>
                              <p className="line-clamp-2 text-sm text-zinc-600">
                                {source.content}
                              </p>
                            </a>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </Modal.Content>
            </Modal>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200"
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              icon="mdi:file-document-outline"
              className="h-6 w-6 text-zinc-400"
            />
            <h2 className="font-normal text-2xl">Deep Research</h2>
          </div>
          <div className="text-sm text-zinc-400">
            Time elapsed: {formatElapsedTime(elapsedTime)}
          </div>
        </div>

        <div className="space-y-6">
          <DeepResearchStatus updates={statusUpdates} />

          {sourceUpdates && sourceUpdates.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="text-sm text-zinc-500">
                Sources found so far:{' '}
                {
                  Array.from(new Set(sourceUpdates.map((s) => s.source.url)))
                    .length
                }
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
