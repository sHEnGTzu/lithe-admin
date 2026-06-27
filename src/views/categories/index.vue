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
  useMessage,
  NInputNumber,
  NTree,
} from 'naive-ui'
import { ref, watch } from 'vue'
import { useInjection, useComponentModifier } from '@/composables'
import { mediaQueryInjectionKey } from '@/injection'
import { ScrollContainer } from '@/components'
import { getCategoryTree, createCategory, updateCategory, deleteCategory } from '@/api'

import type { CategoryVO } from '@/api'

defineOptions({ name: 'Categories' })

const { isMaxMd, isMaxLg } = useInjection(mediaQueryInjectionKey)
const message = useMessage()
const { getPopconfirmModifier } = useComponentModifier()

const treeData = ref<CategoryVO[]>([])
const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', parentId: null as number | null, sort: 0 })
const categoryOptions = ref<{ label: string; value: number | null }[]>([])

function flattenForOptions(list: CategoryVO[], prefix = ''): { label: string; value: number | null }[] {
  const result: { label: string; value: number | null }[] = [{ label: '顶级分类', value: null }]
  function walk(items: CategoryVO[], p: string) {
    items.forEach((item) => {
      result.push({ label: p + item.name, value: item.id })
      if (item.children?.length) walk(item.children, p + '— ')
    })
  }
  walk(list, '')
  return result
}

const { data, refetch } = useQuery({
  key: () => ['categories'],
  query: () => getCategoryTree(),
  staleTime: 0,
})

const { mutate: handleDelete } = useMutation({
  mutation: (id: number) => deleteCategory(id),
  onSuccess: () => { message.success('已删除'); refetch() },
  onError: (err: any) => { message.error(err?.response?.data?.message || '删除失败') },
})

const { mutate: handleSave } = useMutation({
  mutation: () => {
    const data = { name: form.value.name, parentId: form.value.parentId, sort: form.value.sort || 0 }
    return editingId.value ? updateCategory(editingId.value, data) : createCategory(data)
  },
  onSuccess: () => {
    message.success(editingId.value ? '已更新' : '已创建')
    modalVisible.value = false
    refetch()
  },
  onError: (err: any) => { message.error(err?.response?.data?.message || '操作失败') },
})

function openAdd(parentId: number | null = null) {
  editingId.value = null
  form.value = { name: '', parentId, sort: 0 }
  modalVisible.value = true
}

function openEdit(row: CategoryVO) {
  editingId.value = row.id
  form.value = { name: row.name, parentId: row.parentId, sort: row.sort ?? 0 }
  modalVisible.value = true
}

watch(data, (newData) => {
  if (newData) {
    treeData.value = newData.data || []
    categoryOptions.value = flattenForOptions(treeData.value)
  }
})

const columns = [
  { type: 'expand', width: 40 },
  { key: 'id', title: 'ID', width: 60 },
  { key: 'name', title: '分类名称', width: 200 },
  { key: 'sort', title: '排序', width: 80 },
  {
    key: 'actions', title: '操作', width: 150, align: 'center' as const,
    render: (row: CategoryVO) => (
      <NSpace justify="center">
        <NButton size="small" secondary type="primary" onClick={() => openEdit(row)}>编辑</NButton>
        <NPopconfirm {...getPopconfirmModifier()} positiveText="确定" negativeText="取消"
          onPositiveClick={() => handleDelete(row.id)}
        >
          {{
            default: () => '确认删除此分类？',
            trigger: () => <NButton size="small" secondary type="error">删除</NButton>,
          }}
        </NPopconfirm>
      </NSpace>
    ),
  },
]
</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-2" :scrollable="isMaxLg">
    <NCard :size="isMaxMd ? 'small' : undefined" class="flex-1" content-class="flex flex-col">
      <div class="mb-4 flex justify-between items-center">
        <div class="font-bold text-lg">商品分类</div>
        <NButton type="primary" @click="openAdd()">新增分类</NButton>
      </div>
      <NDataTable
        :columns="columns"
        :data="treeData"
        :loading="data === undefined"
        :row-key="(row) => row.id"
        :children-key="(row: any) => row.children"
        :indent="24"
        :bordered="true"
        :max-height="500"
        flex-height
      />
    </NCard>

    <NModal v-model:show="modalVisible" preset="card" :title="editingId ? '编辑分类' : '新增分类'" style="width: 480px" draggable bordered>
      <NForm label-placement="left" label-width="80">
        <NFormItem label="上级分类">
          <NSelect v-model:value="form.parentId" :options="categoryOptions" placeholder="选择上级分类（留空为顶级）" clearable />
        </NFormItem>
        <NFormItem label="分类名称">
          <NInput v-model:value="form.name" placeholder="请输入分类名称" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="form.sort" placeholder="排序值" :min="0" style="width: 100%" />
        </NFormItem>
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
