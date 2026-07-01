import { useQuery } from '@tanstack/react-query'
import { meetingsService } from '../services/meetings.service'

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingsService.getMeetings(),
  })
}
