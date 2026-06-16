import { supabase } from "@/lib/supabase"

export const fetchAll = async (
  table: string,
  selectQuery: string,
  orderColumn?: string,
  ascending: boolean = true
) => {
  const pageSize = 1000
  let from = 0
  let to = pageSize - 1
  let allData: any[] = []
  let hasMore = true

  while (hasMore) {
    let query = supabase.from(table).select(selectQuery)

    if (orderColumn) {
      query = query.order(orderColumn, { ascending })
    }

    const { data, error } = await query.range(from, to)

    if (error) throw error

    allData = [...allData, ...(data || [])]

    if (!data || data.length < pageSize) {
      hasMore = false
    } else {
      from += pageSize
      to += pageSize
    }
  }

  return allData
}