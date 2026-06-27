<script setup lang="tsx">
import { useMutation, useQuery } from '@pinia/colada'
import {
  NButton,
  NDataTable,
  NCard,
  NTag,
  NPopconfirm,
  useMessage,
  NSpace,
  NPagination,
  NInput,
  NSelect,
  NModal,
  NDescriptions,
  NDescriptionsItem,
} from 'naive-ui'
import { ref, watch, reactive } from 'vue'
import { useInjection, useComponentModifier } from '@/composables'
import { mediaQueryInjectionKey } from '@/injection'
import { ScrollContainer } from '@/components'
import { getOrders, updateOrderStatus } from '@/api'

import type { OrderVO } from '@/api'
import type { DataTableColumns, PaginationProps } from 'naive-ui'

defineOptions({ name: 'Orders' })

const { isMaxMd, isMaxLg } = useInjection(mediaQueryInjectionKey)
const message = useMessage()
const { getPopconfirmModifier } = useComponentModifier()

const orderList = ref<OrderVO[]>([])
const keyword = ref('')
const statusFilter = ref('')
const detailVisible = ref(false)
const detailOrder = ref<OrderVO | null>(null)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待付款', value: 'pending' },
  { label: '已付款', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const statusMap: Record<string, { label: string; type: 'warning' | 'success' | 'info' | 'default' | 'error' }> = {
  pending: { label: '待付款', type: 'warning' },
  paid: { label: '已付款', type: 'info' },
  shipped: { label: '已发货', type: 'success' },
  completed: { label: '已完成', type: 'default' },
  cancelled: { label: '已取消', type: 'error' },
}

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  showQuickJumper: true,
  onUpdatePage: (page) => { pagination.page = page; refetch() },
  onUpdatePageSize: (pageSize) => { pagination.pageSize = pageSize; pagination.page = 1; refetch() },
})

const { data, isLoading: loading, refetch } = useQuery({
  key: () => ['orders', pagination.page ?? 1, pagination.pageSize ?? 10, statusFilter.value, keyword.value],
  query: () => getOrders({
    pageNum: pagination.page ?? 1,
    pageSize: pagination.pageSize ?? 10,
    status: statusFilter.value || undefined,
    keyword: keyword.value || undefined,
  }),
  staleTime: 0,
})

const { mutate: mutateStatus } = useMutation({
  mutation: (params: { id: number; status: string }) => updateOrderStatus(params.id, params.status),
  onSuccess: () => { message.success('操作成功'); refetch() },
})

const nextStatusMap: Record<string, string> = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'completed',
}

function showDetail(row: OrderVO) {
  detailOrder.value = row
  detailVisible.value = true
}

const columns: DataTableColumns<OrderVO> = [
  { key: 'orderNo', title: '订单号', width: 190 },
  { key: 'consignee', title: '收货人', width: 90 },
  { key: 'phone', title: '联系电话', width: 130 },
  {
    key: 'totalAmount', title: '金额', width: 100, align: 'right',
    render: (row) => <span class="font-bold">¥{row.totalAmount.toFixed(2)}</span>,
  },
  {
    key: 'status', title: '状态', width: 90, align: 'center',
    render: (row) => {
      const s = statusMap[row.status] || { label: row.status, type: 'default' as const }
      return <NTag type={s.type} size="small">{s.label}</NTag>
    },
  },
  { key: 'createdAt', title: '下单时间', width: 170 },
  {
    key: 'actions', title: '操作', width: 200, align: 'center', fixed: 'right',
    render: (row) => (
      <NSpace justify="center">
        <NButton size="small" secondary type="primary" onClick={() => showDetail(row)}>详情</NButton>
        {nextStatusMap[row.status] && (
          <NPopconfirm {...getPopconfirmModifier()} positiveText="确定" negativeText="取消"
            onPositiveClick={() => mutateStatus({ id: row.id, status: nextStatusMap[row.status] })}
          >
            {{
              default: () => `确认${statusMap[nextStatusMap[row.status]]?.label || ''}？`,
              trigger: () => <NButton size="small" secondary type="success">{statusMap[nextStatusMap[row.status]]?.label || ''}</NButton>,
            }}
          </NPopconfirm>
        )}
        {row.status === 'pending' && (
          <NPopconfirm {...getPopconfirmModifier()} positiveText="确定" negativeText="取消"
            onPositiveClick={() => mutateStatus({ id: row.id, status: 'cancelled' })}
          >
            {{
              default: () => '确认取消该订单？',
              trigger: () => <NButton size="small" secondary type="error">取消</NButton>,
            }}
          </NPopconfirm>
        )}
      </NSpace>
    ),
  },
]

function handleSearch() {
  pagination.page = 1
  refetch()
}

watch(data, (newData) => {
  if (newData) {
    const pageData = newData.data as any
    orderList.value = pageData.records || []
    pagination.itemCount = pageData.total ?? 0
  }
})
</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-2" :scrollable="isMaxLg">
    <NCard :size="isMaxMd ? 'small' : undefined" class="flex-1" content-class="flex flex-col">
      <div class="mb-4 flex items-center gap-2">
        <NInput v-model:value="keyword" placeholder="搜索订单号/收货人" style="width: 240px" clearable />
        <NSelect v-model:value="statusFilter" :options="statusOptions" style="width: 130px" />
        <NButton type="info" @click="handleSearch" :loading="loading">
          <template #icon><span class="iconify ph--magnifying-glass" /></template>查询
        </NButton>
      </div>
      <NDataTable :columns="columns" :data="orderList" :loading="loading" :row-key="(row) => row.id" bordered :max-height="500" flex-height />
      <div class="mt-3 flex justify-end">
        <NPagination v-bind="pagination" :disabled="loading" />
      </div>
    </NCard>

    <NModal v-model:show="detailVisible" preset="card" title="订单详情" style="width: 640px" draggable bordered>
      <div v-if="detailOrder">
        <NDescriptions :column="2" bordered size="small" label-placement="left">
          <NDescriptionsItem label="订单号">{{ detailOrder.orderNo }}</NDescriptionsItem>
          <NDescriptionsItem label="订单状态">
            <NTag :type="statusMap[detailOrder.status]?.type || 'default'" size="small">
              {{ statusMap[detailOrder.status]?.label || detailOrder.status }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="收货人">{{ detailOrder.consignee }}</NDescriptionsItem>
          <NDescriptionsItem label="联系电话">{{ detailOrder.phone }}</NDescriptionsItem>
          <NDescriptionsItem label="收货地址" :span="2">{{ detailOrder.address }}</NDescriptionsItem>
          <NDescriptionsItem label="总金额" :span="2">
            <span class="text-red-500 font-bold text-lg">¥{{ detailOrder.totalAmount.toFixed(2) }}</span>
          </NDescriptionsItem>
          <NDescriptionsItem label="下单时间" :span="2">{{ detailOrder.createdAt }}</NDescriptionsItem>
          <NDescriptionsItem v-if="detailOrder.remark" label="备注" :span="2">{{ detailOrder.remark }}</NDescriptionsItem>
        </NDescriptions>

        <h4 class="mt-4 mb-2 font-bold">商品明细</h4>
        <div v-for="item in detailOrder.items" :key="item.id" class="flex items-center gap-3 mb-2 p-2 bg-gray-50 rounded">
          <div class="flex-1">
            <div class="font-medium">{{ item.productName }}</div>
            <div class="text-gray-500 text-sm">¥{{ item.price.toFixed(2) }} × {{ item.quantity }}</div>
          </div>
          <div class="text-right font-bold">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
        </div>
      </div>
    </NModal>
  </ScrollContainer>
</template>
