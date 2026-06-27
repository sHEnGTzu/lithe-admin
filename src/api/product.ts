import request from '@/utils/request'

export interface ProductVO {
  id: number
  name: string
  description: string
  price: number
  stock: number
  image: string
  categoryId: number
  categoryName: string
  createdAt: string
  updatedAt: string
}

export interface ProductDTO {
  name: string
  description?: string
  price: number
  stock: number
  image?: string
  categoryId: number
}

export function getProducts(params: {
  pageNum: number
  pageSize: number
  keyword?: string
  categoryId?: number
}) {
  return request<PaginationData<ProductVO[]>>({
    url: '/products',
    method: 'get',
    params,
  })
}

export function getProductById(id: number) {
  return request<ProductVO>({
    url: `/products/${id}`,
    method: 'get',
  })
}

export function createProduct(data: ProductDTO) {
  return request<{ id: number }>({
    url: '/products',
    method: 'post',
    data,
  })
}

export function updateProduct(id: number, data: ProductDTO) {
  return request<void>({
    url: `/products/${id}`,
    method: 'put',
    data,
  })
}

export function deleteProduct(id: number) {
  return request<void>({
    url: `/products/${id}`,
    method: 'delete',
  })
}

export function uploadImage(data: FormData) {
  return request<{ url: string }>({
    url: '/upload',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data,
  })
}
