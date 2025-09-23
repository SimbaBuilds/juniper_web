import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { User, Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  imageUrl?: string
}

interface ChatMessageProps {
  message: Message
}

// Function to parse sources from message content
function parseMessageWithSources(content: string) {
  // Try markdown format first: **Sources:** [url], [url], [url]
  const markdownSourcesPattern = /\s*\*\*Sources:\*\*\s*(\[.*?\](?:\s*,\s*\[.*?\])*)\s*$/
  let match = content.match(markdownSourcesPattern)

  if (match) {
    // Extract the content without the sources section
    const cleanContent = content.replace(markdownSourcesPattern, '').trim()

    // Parse the markdown format sources - each URL is wrapped in brackets
    const sourcesString = match[1]
    const sources = sourcesString
      .match(/\[(.*?)\]/g) // Find all [url] patterns
      ?.map(url => url.slice(1, -1).trim()) // Remove brackets and trim
      .filter(url => url.length > 0) || []

    return { content: cleanContent, sources }
  }

  // Fallback to original format: Sources: [url1, url2, etc...]
  const plainSourcesPattern = /\n*Sources:\s*\[(.*?)\]\s*$/
  match = content.match(plainSourcesPattern)

  if (!match) {
    return { content, sources: [] }
  }

  // Extract the content without the sources section
  const cleanContent = content.replace(plainSourcesPattern, '').trim()

  // Parse the sources - split by comma and clean up each URL
  const sourcesString = match[1]
  const sources = sourcesString
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0)

  return { content: cleanContent, sources }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [sourcesExpanded, setSourcesExpanded] = useState(false)

  // Parse message content to separate main content and sources
  const { content: mainContent, sources } = parseMessageWithSources(message.content)
  
  return (
    <div className={cn(
      "flex gap-2 md:gap-3 mb-3 md:mb-4 last:mb-0",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-3 w-3 md:h-4 md:w-4 text-primary" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] md:max-w-[80%] rounded-lg px-3 md:px-4 py-2 md:py-3",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {/* Image Display */}
        {message.imageUrl && (
          <div className="mb-3">
            <img
              src={message.imageUrl}
              alt="Shared image"
              className="max-w-full h-auto rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.imageUrl, '_blank')}
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
          </div>
        )}
        
        {/* Text Content */}
        {mainContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ node, className, children, ...props }) => {
                  const codeProps = props as any
                  if (codeProps.inline) {
                    return <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-sm" {...props}>{children}</code>
                  }
                  return (
                    <pre className="overflow-x-auto p-2 rounded bg-black/10 dark:bg-white/10">
                      <code className="font-mono text-sm" {...props}>{children}</code>
                    </pre>
                  )
                },
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                    {children}
                  </a>
                ),
              }}
            >
              {mainContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources Dropdown - Only for assistant messages with sources */}
        {!isUser && sources.length > 0 && (
          <div className="mt-3">
            <Collapsible open={sourcesExpanded} onOpenChange={setSourcesExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {sourcesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Sources ({sources.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-1 pl-6">
                  {sources.map((source, index) => (
                    <div key={index} className="text-sm">
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {source}
                      </a>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        <div className={cn(
          "text-xs mt-2 opacity-60",
          isUser ? "text-primary-foreground" : "text-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {isUser && (
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}