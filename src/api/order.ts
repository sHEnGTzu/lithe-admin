import request from '@/utils/request'

export interface OrderItemVO {
  id: number
  productId: number
  productName: string
  price: number
  quantity: number
  image: string
}

export interface OrderVO {
  id: number
  orderNo: string
  userId: number
  userName: string
  totalAmount: number
  status: string
  consignee: string
  phone: string
  address: string
  remark: string
  createdAt: string
  items: OrderItemVO[]
}

export interface OrderItemDTO {
  productId: number
  quantity: number
}

export interface OrderDTO {
  consignee: string
  phone: string
  address: string
  remark?: string
  items: OrderItemDTO[]
}

export function getOrders(params: {
  pageNum: number
  pageSize: number
  status?: string
  keyword?: string
}) {
  return request<PaginationData<OrderVO[]>>({
    url: '/orders',
    method: 'get',
    params,
  })
}

export function getOrderById(id: number) {
  return request<OrderVO>({
    url: `/orders/${id}`,
    method: 'get',
  })
}

export function createOrder(data: OrderDTO) {
  return request<{ id: number }>({
    url: '/orders',
    method: 'post',
    data,
  })
}

export function updateOrderStatus(id: number, status: string) {
  return request<void>({
    url: `/orders/${id}/status`,
    method: 'put',
    data: { status },
  })
}
