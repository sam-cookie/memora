import { useQueryClient } from '@tanstack/react-query'
import { actionItemsService } from '@/features/action-items/services/actionItems.service'
import { ACTION_ITEM_TOOLS } from '../services/chat.service'
import type { ToolDefinition } from '../services/chat.service'
import type { ActionItemPriority } from '@/types/database'

export interface ToolHandler {
  loadingLabel: string
  execute: (args: unknown) => Promise<string>
}

export type ToolHandlers = Record<string, ToolHandler>

interface CreateArgs {
  meeting_id: string
  content: string
  assignee?: string
  priority?: ActionItemPriority
  due_date?: string
}

interface EditArgs {
  id: string
  content?: string
  assignee?: string | null
  priority?: ActionItemPriority
  due_date?: string | null
  completed?: boolean
}

interface DeleteArgs {
  id: string
}

function isCreateArgs(v: unknown): v is CreateArgs {
  return typeof v === 'object' && v !== null && 'meeting_id' in v && 'content' in v
}

function isEditArgs(v: unknown): v is EditArgs {
  return typeof v === 'object' && v !== null && 'id' in v
}

function isDeleteArgs(v: unknown): v is DeleteArgs {
  return typeof v === 'object' && v !== null && 'id' in v
}

export function useActionItemTools(meetingId?: string): { tools: ToolDefinition[]; handlers: ToolHandlers } {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['action-items'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    if (meetingId) {
      void queryClient.invalidateQueries({ queryKey: ['action-items', meetingId] })
    }
  }

  const handlers: ToolHandlers = {
    create_action_item: {
      loadingLabel: 'Creating action item…',
      execute: async (args) => {
        if (!isCreateArgs(args)) throw new Error('Invalid arguments for create_action_item')
        try {
          await actionItemsService.create({
            meeting_id: args.meeting_id,
            content: args.content,
            assignee: args.assignee,
            priority: args.priority,
            due_date: args.due_date,
          })
        } catch {
          throw new Error("I wasn't able to create that action item. Please try again.")
        }
        invalidate()
        return `Created action item: "${args.content}"`
      },
    },

    edit_action_item: {
      loadingLabel: 'Updating action item…',
      execute: async (args) => {
        if (!isEditArgs(args)) throw new Error('Invalid arguments for edit_action_item')
        const { id, ...rest } = args
        try {
          await actionItemsService.update(id, rest)
        } catch {
          throw new Error("I wasn't able to update that action item. Please try again.")
        }
        invalidate()
        if (args.completed === true) return 'Marked action item as complete.'
        if (args.completed === false) return 'Marked action item as incomplete.'
        const summary = args.content ? `: "${args.content}"` : ''
        return `Action item updated${summary}`
      },
    },

    delete_action_item: {
      loadingLabel: 'Deleting action item…',
      execute: async (args) => {
        if (!isDeleteArgs(args)) throw new Error('Invalid arguments for delete_action_item')
        try {
          await actionItemsService.remove(args.id)
        } catch {
          throw new Error("I wasn't able to delete that action item. Please try again.")
        }
        invalidate()
        return 'Action item deleted.'
      },
    },
  }

  return { tools: ACTION_ITEM_TOOLS, handlers }
}
