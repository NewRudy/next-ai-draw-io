# 右键删除功能测试指南

## 实现的功能

✅ **已完成的功能：**

1. **右键菜单组件** (`components/ui/context-menu.tsx`)
   - 基于Radix UI的完整右键菜单实现
   - 包含菜单项、触发器、内容等组件

2. **单项删除功能** (`contexts/diagram-context.tsx`)
   - 新增 `deleteHistoryItem(index: number)` 函数
   - 支持从本地存储中删除特定历史项

3. **历史对话框集成** (`components/history-dialog.tsx`)
   - 为每个历史版本添加右键菜单支持
   - 点击右键显示"删除版本"选项
   - 包含确认对话框防止误操作

## 测试步骤

1. **打开历史对话框**
   - 在应用界面中找到"历史"按钮并点击
   - 确保有多个历史版本存在

2. **测试右键菜单**
   - 在历史版本上点击右键
   - 应该显示包含"删除版本"的菜单

3. **测试删除功能**
   - 点击"删除版本"
   - 确认删除对话框
   - 检查该版本是否被删除

4. **测试边界情况**
   - 删除所有版本后检查空状态
   - 测试删除后剩余版本的重新编号

## 技术实现细节

### 右键菜单使用
```tsx
<ContextMenu>
    <ContextMenuTrigger>
        {/* 右键点击区域 */}
    </ContextMenuTrigger>
    <ContextMenuContent>
        <ContextMenuItem onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Version
        </ContextMenuItem>
    </ContextMenuContent>
</ContextMenu>
```

### 删除函数调用
```tsx
const { deleteHistoryItem } = useDiagram();

// 删除指定索引的历史项
deleteHistoryItem(index);
```

## 注意事项

- 删除操作有确认对话框防止误操作
- 删除后自动更新本地存储
- 右键菜单不影响左键点击恢复功能
- 菜单样式与现有UI保持一致