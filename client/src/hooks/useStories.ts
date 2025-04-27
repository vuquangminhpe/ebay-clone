import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import storiesApi, { NewsFeedStory } from '@/apis/stories.api'
import { toast } from 'sonner'

interface UseStoriesOptions {
  limit?: number
  page?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

const useStories = (options: UseStoriesOptions = {}) => {
  const { limit = 10, page = 1, autoRefresh = false, refreshInterval = 30000 } = options

  const viewedStoriesRef = useRef<Set<string>>(new Set())
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['news-feed-stories', limit, page],
    queryFn: () => storiesApi.getNewsFeedStories(limit, page),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5 * 60 * 1000
  })

  const stories = data?.data?.result || []

  const viewStoryMutation = useMutation({
    mutationFn: storiesApi.viewStory,
    onSuccess: () => {
      refetch()
    },
    onError: () => {
      toast.error('Error viewing story')
    }
  })

  const reactStoryMutation = useMutation({
    mutationFn: storiesApi.addStoryReaction,
    onSuccess: () => {
      toast.success('Story reacted successfully')
      refetch()
    },
    onError: () => {
      toast.error('Error reacting to story')
    }
  })

  const createStoryMutation = useMutation({
    mutationFn: storiesApi.createStory,
    onSuccess: () => {
      toast.success('Story created successfully')
      refetch()
    },
    onError: () => {
      toast.error('Error creating story')
    }
  })

  const isStoryViewed = useCallback((story: NewsFeedStory) => {
    if (!story?._id) return false

    if (viewedStoriesRef.current.has(story._id)) return true

    return story.viewer?.some((view) => view.view_status === 'seen') || false
  }, [])

  const openViewer = useCallback((index: number) => {
    setActiveStoryIndex(index)
  }, [])

  const closeViewer = useCallback(() => {
    setActiveStoryIndex(null)
  }, [])

  const markStoryAsViewed = useCallback(
    (storyId: string) => {
      if (!storyId) return

      viewedStoriesRef.current.add(storyId)

      viewStoryMutation.mutate({
        story_id: storyId,
        view_status: 'seen',
        content: ''
      })
    },
    [viewStoryMutation]
  )

  const refreshStories = useCallback(() => {
    refetch()
  }, [refetch])

  return {
    stories,
    isLoading,
    error,
    refetch: refreshStories,
    isStoryViewed,
    openViewer,
    closeViewer,
    activeStoryIndex,
    markStoryAsViewed,
    viewStoryMutation,
    reactStoryMutation,
    createStoryMutation
  }
}

export default useStories
