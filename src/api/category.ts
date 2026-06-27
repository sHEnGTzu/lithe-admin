import request from '@/utils/request'

export interface CategoryVO {
  id: number
  name: string
  parentId: number | null
  sort: number
  children: CategoryVO[]
}

export function getCategoryTree() {
  return request<CategoryVO[]>({
    url: '/categories/tree',
    method: 'get',
  })
}

export function createCategory(data: { name: string; parentId?: number | null; sort?: number }) {
  return request<{ id: number }>({
    url: '/categories',
    method: 'post',
    data,
  })
}

export function updateCategory(id: number, data: { name: string; parentId?: number | null; sort?: number }) {
  return request<void>({
    url: `/categories/${id}`,
    method: 'put',
    data,
  })
}

export function deleteCategory(id: number) {
  return request<void>({
    url: `/categories/${id}`,
    method: 'delete',
  })
}
