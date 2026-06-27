<script setup lang="tsx">
import { useMutation, useQuery } from '@pinia/colada'
import {
  NButton,
  NDataTable,
  NCard,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NPopconfirm,
  NSpace,
  NPagination,
  NInputNumber,
  useMessage,
} from 'naive-ui'
import { ref, watch, reactive } from 'vue'
import { useInjection, useComponentModifier } from '@/composables'
import { mediaQueryInjectionKey } from '@/injection'
import { ScrollContainer } from '@/components'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategoryTree } from '@/api'

import type { ProductVO, CategoryVO } from '@/api'
import type { DataTableColumns, PaginationProps } from 'naive-ui'

defineOptions({ name: 'Products' })

const { isMaxMd, isMaxLg } = useInjection(mediaQueryInjectionKey)
const message = useMessage()
const { getPopconfirmModifier } = useComponentModifier()

const productList = ref<ProductVO[]>([])
const keyword = ref('')
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', description: '', price: 0, stock: 0, image: '', categoryId: null as number | null })
const categoryOptions = ref<{ label: string; value: number }[]>([])

function flattenCategory(list: CategoryVO[]): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = []
  function walk(items: CategoryVO[]) {
    items.forEach((item) => {
      result.push({ label: item.name, value: item.id })
      if (item.children?.length) walk(item.children)
    })
  }
  walk(list)
  return result
}

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  itemCount: 0,
  showQuickJumper: true,
  onUpdatePage: (page) => { pagination.page = page; refetch() },
  onUpdatePageSize: (pageSize) => { pagination.pageSize = pageSize; pagination.page = 1; refetch() },
})

const { data, isLoading: loading, refetch } = useQuery({
  key: () => ['products', pagination.page ?? 1, pagination.pageSize ?? 10, keyword.value],
  query: () => getProducts({
    pageNum: pagination.page ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: keyword.value || undefined,
  }),
  staleTime: 0,
})

const { data: catData } = useQuery({
  key: () => ['categories-tree'],
  query: () => getCategoryTree(),
  staleTime: 60_000,
})

watch(catData, (d) => {
  if (d) categoryOptions.value = flattenCategory(d.data || [])
})

const { mutate: handleDelete } = useMutation({
  mutation: (id: number) => deleteProduct(id),
  onSuccess: () => { message.success('已删除'); refetch() },
})

const { mutate: handleSave } = useMutation({
  mutation: () => {
    const d = { name: form.value.name, description: form.value.description || undefined, price: form.value.price, stock: form.value.stock, image: form.value.image || undefined, categoryId: form.value.categoryId! }
    return editingId.value ? updateProduct(editingId.value, d) : createProduct(d)
  },
  onSuccess: () => {
    message.success(editingId.value ? '已更新' : '已创建')
    modalVisible.value = false
    refetch()
  },
})

function openAdd() {
  editingId.value = null
  form.value = { name: '', description: '', price: 0, stock: 0, image: '', categoryId: null }
  modalVisible.value = true
}

function openEdit(row: ProductVO) {
  editingId.value = row.id
  form.value = { name: row.name, description: row.description || '', price: row.price, stock: row.stock, image: row.image || '', categoryId: row.categoryId }
  modalVisible.value = true
}

function handleSearch() {
  pagination.page = 1
  refetch()
}

watch(data, (newData) => {
  if (newData) {
    const pageData = newData.data as any
    productList.value = pageData.records || []
    pagination.itemCount = pageData.total ?? 0
  }
})

const columns: DataTableColumns<ProductVO> = [
  { key: 'id', title: 'ID', width: 60 },
  { key: 'name', title: '商品名称', width: 160 },
  { key: 'categoryName', title: '分类', width: 100 },
  { key: 'price', title: '价格', width: 100, align: 'right', render: (row) => <span>¥{row.price.toFixed(2)}</span> },
  { key: 'stock', title: '库存', width: 80, align: 'right' },
  { key: 'description', title: '描述', ellipsis: { tooltip: true } },
  {
    key: 'actions', title: '操作', width: 150, align: 'center', fixed: 'right',
    render: (row) => (
      <NSpace justify="center">
        <NButton size="small" secondary type="primary" onClick={() => openEdit(row)}>编辑</NButton>
        <NPopconfirm {...getPopconfirmModifier()} positiveText="确定" negativeText="取消"
          onPositiveClick={() => handleDelete(row.id)}
        >
          {{ default: () => '确认删除？', trigger: () => <NButton size="small" secondary type="error">删除</NButton> }}
        </NPopconfirm>
      </NSpace>
    ),
  },
]
</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-2" :scrollable="isMaxLg">
    <NCard :size="isMaxMd ? 'small' : undefined" class="flex-1" content-class="flex flex-col">
      <div class="mb-4 flex justify-between items-center max-xl:flex-col max-xl:gap-y-2">
        <div class="flex gap-2">
          <NInput v-model:value="keyword" placeholder="搜索商品名称" style="width: 200px" clearable />
          <NButton type="info" @click="handleSearch" :loading="loading">
            <template #icon><span class="iconify ph--magnifying-glass" /></template>查询
          </NButton>
        </div>
        <NButton type="primary" @click="openAdd">新增商品</NButton>
      </div>
      <NDataTable :columns="columns" :data="productList" :loading="loading" :row-key="(row) => row.id" bordered :max-height="500" flex-height />
      <div class="mt-3 flex justify-end">
        <NPagination v-bind="pagination" :disabled="loading" />
      </div>
    </NCard>

    <NModal v-model:show="modalVisible" preset="card" :title="editingId ? '编辑商品' : '新增商品'" style="width: 560px" draggable bordered>
      <NForm label-placement="left" label-width="80">
        <NFormItem label="商品名称"><NInput v-model:value="form.name" placeholder="请输入商品名称" /></NFormItem>
        <NFormItem label="商品分类"><NSelect v-model:value="form.categoryId" :options="categoryOptions" placeholder="请选择分类" /></NFormItem>
        <NFormItem label="价格"><NInput v-model:value="form.price" placeholder="0.00" /></NFormItem>
        <NFormItem label="库存"><NInputNumber v-model:value="form.stock" placeholder="0" :min="0" style="width: 100%" /></NFormItem>
        <NFormItem label="图片"><NInput v-model:value="form.image" placeholder="图片URL（可选）" /></NFormItem>
        <NFormItem label="描述"><NInput v-model:value="form.description" type="textarea" placeholder="商品描述（可选）" /></NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave()">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </ScrollContainer>
</template>
