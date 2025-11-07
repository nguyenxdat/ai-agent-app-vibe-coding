/**
 * MarkdownMessage Component
 * Renders markdown content with code block support
 */

import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './CodeBlock'
import type { Components } from 'react-markdown'

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  // Custom components for markdown rendering
  const components: Components = {
    // Code blocks with syntax highlighting
    code(props) {
      const { node, className, children, ...rest } = props
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : 'text'
      const code = String(children).replace(/\n$/, '')

      // Check if inline code (no className means inline)
      const isInline = !className

      return !isInline ? (
        <CodeBlock code={code} language={language} />
      ) : (
        <code
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-red-600 dark:text-red-400"
          {...rest}
        >
          {children}
        </code>
      )
    },

    // Links with security
    a(props) {
      const { node, children, href, ...rest } = props
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
          {...rest}
        >
          {children}
        </a>
      )
    },

    // Paragraphs
    p(props) {
      const { node, children, ...rest } = props
      return (
        <p className="mb-4 last:mb-0" {...rest}>
          {children}
        </p>
      )
    },

    // Headings
    h1(props) {
      const { node, children, ...rest } = props
      return (
        <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" {...rest}>
          {children}
        </h1>
      )
    },
    h2(props) {
      const { node, children, ...rest } = props
      return (
        <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0" {...rest}>
          {children}
        </h2>
      )
    },
    h3(props) {
      const { node, children, ...rest } = props
      return (
        <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...rest}>
          {children}
        </h3>
      )
    },

    // Lists
    ul(props) {
      const { node, children, ...rest } = props
      return (
        <ul className="list-disc list-inside mb-4 space-y-1" {...rest}>
          {children}
        </ul>
      )
    },
    ol(props) {
      const { node, children, ...rest } = props
      return (
        <ol className="list-decimal list-inside mb-4 space-y-1" {...rest}>
          {children}
        </ol>
      )
    },
    li(props) {
      const { node, children, ...rest } = props
      return (
        <li className="ml-4" {...rest}>
          {children}
        </li>
      )
    },

    // Blockquotes
    blockquote(props) {
      const { node, children, ...rest } = props
      return (
        <blockquote
          className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 mb-4 italic text-gray-700 dark:text-gray-300"
          {...rest}
        >
          {children}
        </blockquote>
      )
    },

    // Horizontal rule
    hr(props) {
      const { node, ...rest } = props
      return <hr className="my-6 border-gray-300 dark:border-gray-600" {...rest} />
    },

    // Tables
    table(props) {
      const { node, children, ...rest } = props
      return (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600" {...rest}>
            {children}
          </table>
        </div>
      )
    },
    th(props) {
      const { node, children, ...rest } = props
      return (
        <th
          className="px-3 py-2 text-left text-sm font-semibold bg-gray-100 dark:bg-gray-800"
          {...rest}
        >
          {children}
        </th>
      )
    },
    td(props) {
      const { node, children, ...rest } = props
      return (
        <td className="px-3 py-2 text-sm border-t border-gray-200 dark:border-gray-700" {...rest}>
          {children}
        </td>
      )
    },

    // Strong/Bold
    strong(props) {
      const { node, children, ...rest } = props
      return (
        <strong className="font-semibold" {...rest}>
          {children}
        </strong>
      )
    },

    // Emphasis/Italic
    em(props) {
      const { node, children, ...rest } = props
      return (
        <em className="italic" {...rest}>
          {children}
        </em>
      )
    },
  }

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  )
}
