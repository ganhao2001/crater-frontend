/**
 * Copyright 2025 RAIDS Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DataTableToolbarConfig } from '@/components/custom/DataTable/DataTableToolbar'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FC, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/custom/DataTable/DataTableColumnHeader'
import { DataTable } from '@/components/custom/DataTable'
import { Button } from '@/components/ui/button'
import { ImageUploadForm } from './UploadForm'
import { TimeDistance } from '@/components/custom/TimeDistance'
import {
  getHeader,
  apiUserListImage,
  apiUserChangeImagePublicStatus,
  ImageInfoResponse,
  apiUserChangeImageDescription,
  ImageLinkPair,
  apiUserDeleteImageList,
  apiUserChangeImageTaskType,
  UpdateDescription,
  UpdateTaskType,
  ListImageResponse,
  UpdateImageTag,
  apiUserUpdateImageTags,
} from '@/services/api/imagepack'
import { logger } from '@/utils/loglevel'
import { toast } from 'sonner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  CheckCheck,
  Globe,
  Lock,
  ListCheck,
  Tag,
  Trash2Icon,
  AlertTriangle,
  SquareCheckBig,
  CopyIcon,
  ImportIcon,
  Tags,
  ListTodo,
} from 'lucide-react'
import { useAtomValue } from 'jotai'
import { globalUserInfo } from '@/utils/store'
import ImageLabel from '@/components/label/ImageLabel'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { JobType } from '@/services/api/vcjob'
import { AxiosResponse } from 'axios'
import { IResponse } from '@/services/types'
import VisibilityBadge, { Visibility, visibilityTypes } from '@/components/badge/VisibilityBadge'
import { ValidDialog } from './ValidDialog'
import { StatusDialog } from './StatusDialog'
import { RenameDialog } from './RenameDialog'
import { DeleteDialog } from './DeleteDialog'
import UserLabel from '@/components/label/UserLabel'
import { TagsDialog } from './TagsDialog'
import TooltipLink from '@/components/label/TooltipLink'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ImageShareSheet } from './ShareImageSheet'
import { Badge } from '@/components/ui/badge'

const toolbarConfig: DataTableToolbarConfig = {
  globalSearch: {
    enabled: true,
  },
  filterOptions: [
    {
      key: 'imageShareStatus',
      title: '可见性',
      option: visibilityTypes,
    },
  ],
  getHeader: getHeader,
}

enum Dialogs {
  delete = 'delete',
  status = 'status',
  rename = 'rename',
  valid = 'valid',
  tags = 'tags',
}

export const Component: FC = () => {
  return (
    <ImageListTable
      apiListImage={apiUserListImage}
      apiDeleteImageList={apiUserDeleteImageList}
      apiChangeImagePublicStatus={apiUserChangeImagePublicStatus}
      apiChangeImageDescription={apiUserChangeImageDescription}
      apiChangeImageTaskType={apiUserChangeImageTaskType}
      isAdminMode={false}
    />
  )
}

interface ImageListTableProps {
  apiListImage: () => Promise<AxiosResponse<IResponse<ListImageResponse>>>
  apiDeleteImageList: (idList: number[]) => Promise<AxiosResponse<IResponse<string>>>
  apiChangeImagePublicStatus: (id: number) => Promise<AxiosResponse<IResponse<string>>>
  apiChangeImageDescription: (data: UpdateDescription) => Promise<AxiosResponse<IResponse<string>>>
  apiChangeImageTaskType: (data: UpdateTaskType) => Promise<AxiosResponse<IResponse<string>>>
  isAdminMode: boolean
}

export const ImageListTable: FC<ImageListTableProps> = ({
  apiListImage,
  apiDeleteImageList,
  apiChangeImagePublicStatus,
  apiChangeImageDescription,
  apiChangeImageTaskType,
  isAdminMode,
}) => {
  const queryClient = useQueryClient()
  const [openUploadSheet, setOpenUploadSheet] = useState(false)
  const [openCheckDialog, setCheckOpenDialog] = useState(false)
  const [selectedLinkPairs, setSelectedLinkPairs] = useState<ImageLinkPair[]>([])

  const user = useAtomValue(globalUserInfo)
  const imageInfo = useQuery({
    queryKey: ['imagelink', 'list'],
    queryFn: () => apiListImage(),
    select: (res) =>
      res.data.data.imageList.map((i) => ({
        ...i,
        visibility: i.imageShareStatus,
        isPublic: i.imageShareStatus == Visibility.Public,
        image: `${i.imageLink} (${i.description})`,
      })),
  })

  const refetchImagePackList = async () => {
    try {
      // 并行发送所有异步请求
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['imagelink', 'list'] })])
    } catch (error) {
      logger.error('更新查询失败', error)
    }
  }
  const { mutate: deleteUserImageList } = useMutation({
    mutationFn: (idList: number[]) => apiDeleteImageList(idList),
    onSuccess: async () => {
      await refetchImagePackList()
      toast.success('镜像已删除')
    },
  })
  const { mutate: changeImagePublicStatus } = useMutation({
    mutationFn: (id: number) => apiChangeImagePublicStatus(id),
    onSuccess: async () => {
      await refetchImagePackList()
      toast.success('镜像状态更新')
    },
  })
  const { mutate: updateImageDescription } = useMutation({
    mutationFn: (data: { id: number; description: string }) => apiChangeImageDescription(data),
    onSuccess: async () => {
      await refetchImagePackList()
      toast.success('镜像描述已更新')
    },
  })
  const { mutate: updateImageTaskType } = useMutation({
    mutationFn: (data: { id: number; taskType: JobType }) => apiChangeImageTaskType(data),
    onSuccess: async () => {
      await refetchImagePackList()
      toast.success('镜像类型已更新')
    },
  })

  const { mutate: updateImageTags } = useMutation({
    mutationFn: (data: { id: number; tags: string[] }) => apiUserUpdateImageTags(data),
    onSuccess: async () => {
      await refetchImagePackList()
      toast.success('镜像标签已更新')
    },
  })
  const columns: ColumnDef<ImageInfoResponse>[] = [
    {
      accessorKey: 'image',
      header: ({ column }) => <DataTableColumnHeader column={column} title={getHeader('image')} />,
      cell: ({ row }) => {
        if (row.original.imageBuildSource == 1) {
          return (
            <TooltipLink
              name={
                <ImageLabel
                  description={row.original.description}
                  url={row.original.imageLink}
                  tags={row.original.tags}
                />
              }
              to={`../createimage/${row.original.imagepackName}`}
              tooltip={`查看镜像详情`}
            />
          )
        } else {
          return (
            <ImageLabel
              description={row.original.description}
              url={row.original.imageLink}
              tags={row.original.tags}
            />
          )
        }
      },
    },
    {
      id: 'archs',
      accessorKey: 'archs',
      header: ({ column }) => <DataTableColumnHeader column={column} title={getHeader('archs')} />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.archs || []).map((arch, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {arch}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'userInfo',
      accessorKey: 'userInfo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={getHeader('userInfo')} />
      ),
      cell: ({ row }) => <UserLabel info={row.original.userInfo} />,
    },
    {
      accessorKey: 'imageShareStatus',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={getHeader('imageShareStatus')} />
      ),
      cell: ({ row }) => {
        const visibilityValue = row.getValue<Visibility>('imageShareStatus')
        return <VisibilityBadge visibility={visibilityValue} />
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={getHeader('createdAt')} />
      ),
      cell: ({ row }) => {
        return <TimeDistance date={row.getValue('createdAt')}></TimeDistance>
      },
      sortingFn: 'datetime',
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const imageInfo = row.original
        return (
          <Actions
            imageInfo={imageInfo}
            onChangeStatus={changeImagePublicStatus}
            onUpdateDescription={updateImageDescription}
            linkPairs={[
              {
                id: imageInfo.ID,
                imageLink: imageInfo.imageLink,
                description: imageInfo.description,
                creator: imageInfo.userInfo,
              },
            ]}
            onDeleteImageList={deleteUserImageList}
            userName={user.name}
            onChangeType={updateImageTaskType}
            isAdminMode={isAdminMode}
            onChangeTags={updateImageTags}
          />
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        info={{
          title: '镜像列表',
          description: '展示可用的公共或私有镜像，在作业提交时可供选择',
        }}
        storageKey="imagelink"
        query={imageInfo}
        columns={columns}
        toolbarConfig={toolbarConfig}
        className="col-span-3"
        multipleHandlers={[
          {
            title: (rows) => `删除 ${rows.length} 个镜像链接`,
            description: (rows) => (
              <div className="border-destructive/20 bg-destructive/5 rounded-md border px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-full overflow-hidden">
                    <p className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="text-destructive h-4 w-4" />
                      <span className="text-destructive text-sm leading-4">
                        以下镜像创建任务和对应镜像链接将被删除，确认要继续吗？
                      </span>
                    </p>
                    <Separator className="my-2" />
                    <ScrollArea className="h-[200px] w-full overflow-hidden">
                      <div className="p-4">
                        {rows.map((row, index) => (
                          <p key={index} className="text-muted-foreground text-sm">
                            {`『${row.original.description}』`}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            ),
            icon: <Trash2Icon className="text-destructive" />,
            handleSubmit: (rows) => {
              const ids = rows.map((row) => row.original.ID)
              deleteUserImageList(ids)
            },
            isDanger: true,
          },
          {
            title: (rows) => `检测 ${rows.length} 个镜像链接`,
            description: (rows) => (
              <div className="rounded-md border border-green-600/20 bg-green-600/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-full overflow-hidden">
                    <p className="flex items-center gap-2 font-medium">
                      <SquareCheckBig className="h-4 w-4 text-green-600" />
                      <span className="text-sm leading-4 text-green-600">以下镜像链接将被检测</span>
                    </p>
                    <Separator className="my-2" />
                    <ScrollArea className="h-[200px] w-full overflow-hidden">
                      <div className="p-4">
                        {rows.map((row, index) => (
                          <p key={index} className="text-muted-foreground text-sm">
                            {`『${row.original.description}』`}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            ),
            icon: <CheckCheck className="text-green-600" />,
            handleSubmit: (rows) => {
              setSelectedLinkPairs(
                rows.map((row) => ({
                  id: row.original.ID,
                  imageLink: row.original.imageLink,
                  description: row.original.description,
                  creator: row.original.userInfo,
                }))
              )
              setCheckOpenDialog(true)
            },
            isDanger: false,
          },
        ]}
      >
        <Dialog open={openCheckDialog} onOpenChange={setCheckOpenDialog}>
          <DialogContent>
            <ValidDialog
              linkPairs={selectedLinkPairs}
              onDeleteLinks={(invalidPairs: ImageLinkPair[]) => {
                deleteUserImageList(
                  isAdminMode
                    ? invalidPairs.map((pair) => pair.id)
                    : invalidPairs
                        .filter((pair) => pair.creator.username === user.name)
                        .map((pair) => pair.id)
                )
              }}
            />
          </DialogContent>
        </Dialog>
        {!isAdminMode ? (
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => setOpenUploadSheet(true)}
          >
            <ImportIcon />
            导入镜像
          </Button>
        ) : null}
      </DataTable>
      <ImageUploadForm
        isOpen={openUploadSheet}
        onOpenChange={setOpenUploadSheet}
        title="导入镜像"
        description="导入镜像"
        className="sm:max-w-3xl"
        closeSheet={() => setOpenUploadSheet(false)}
      />
    </>
  )
}

interface ActionsProps {
  imageInfo: ImageInfoResponse
  onChangeStatus: (id: number) => void
  onUpdateDescription: (data: { id: number; description: string }) => void
  linkPairs: ImageLinkPair[]
  onDeleteImageList: (ids: number[]) => void
  userName: string
  onChangeType: (data: { id: number; taskType: JobType }) => void
  isAdminMode: boolean
  onChangeTags: (data: { id: number; tags: string[] }) => void
}

const Actions: FC<ActionsProps> = ({
  imageInfo,
  onChangeStatus,
  onUpdateDescription,
  linkPairs,
  onDeleteImageList,
  userName,
  onChangeType,
  isAdminMode,
  onChangeTags,
}) => {
  const [openDialog, setOpenDialog] = useState(false)
  const [openShareSheet, setOpenShareSheet] = useState(false)
  const [dialog, setDialog] = useState<Dialogs | undefined>(undefined)
  const isDisabled = !isAdminMode && imageInfo.userInfo.username !== userName
  return (
    <div className="flex flex-row space-x-1">
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">操作</span>
              <DotsHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-muted-foreground text-xs">操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard
                  .writeText(imageInfo.imageLink)
                  .then(() => {
                    toast.success('镜像地址已复制到剪贴板')
                  })
                  .catch((err) => {
                    toast.error('复制失败')
                    logger.error('复制失败', err)
                  })
              }}
            >
              <CopyIcon className="text-blue-600" />
              复制链接
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setDialog(Dialogs.valid)
                setOpenDialog(true)
              }}
            >
              <CheckCheck className="text-green-600" />
              检验有效性
            </DropdownMenuItem>
            {isAdminMode && (
              <DropdownMenuItem
                disabled={isDisabled}
                onClick={() => {
                  setDialog(Dialogs.status)
                  setOpenDialog(true)
                }}
              >
                {imageInfo.isPublic === true ? (
                  <Lock className="text-amber-600" />
                ) : (
                  <Globe className="text-green-600" />
                )}
                {imageInfo.isPublic === true ? '设为私有' : '设为公共'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={isDisabled}
              onClick={() => {
                setOpenShareSheet(true)
              }}
            >
              <ListTodo className="text-green-600" />
              镜像分享
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isDisabled}
                className={`${isDisabled ? 'cursor-not-allowed opacity-50 data-disabled:pointer-events-none' : ''} group`}
              >
                <Tag className="mr-2 size-4 text-cyan-600" />
                更改类型
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={`${imageInfo.taskType}`}>
                  {Object.keys(JobType).map((key) => (
                    <DropdownMenuRadioItem
                      key={key}
                      value={key}
                      disabled={[JobType.DeepSpeed, JobType.KubeRay, JobType.OpenMPI].includes(
                        JobType[key as keyof typeof JobType]
                      )}
                      onClick={() =>
                        onChangeType({
                          id: imageInfo.ID,
                          taskType: JobType[key as keyof typeof JobType],
                        })
                      }
                    >
                      {key}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              disabled={isDisabled}
              onClick={() => {
                setDialog(Dialogs.tags)
                setOpenDialog(true)
              }}
            >
              <Tags className="text-cyan-600" />
              修改标签
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isDisabled}
              onClick={() => {
                setDialog(Dialogs.rename)
                setOpenDialog(true)
              }}
            >
              <ListCheck className="text-orange-600" />
              重命名
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={isDisabled}
              onClick={() => {
                setDialog(Dialogs.delete)
                setOpenDialog(true)
              }}
            >
              <Trash2Icon className="text-red-600" />
              删除镜像
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          {dialog === Dialogs.delete ? (
            <DeleteDialog
              imageLinks={[imageInfo.imageLink]}
              onDeleteImageList={() => onDeleteImageList([imageInfo.ID])}
            />
          ) : dialog === Dialogs.status ? (
            <StatusDialog
              imageLink={imageInfo.imageLink}
              isPublic={imageInfo.isPublic}
              onChange={() => onChangeStatus(imageInfo.ID)}
            />
          ) : dialog === Dialogs.rename ? (
            <RenameDialog
              imageDescription={imageInfo.description}
              onRename={(newDescription) =>
                onUpdateDescription({
                  id: imageInfo.ID,
                  description: newDescription,
                })
              }
            />
          ) : dialog === Dialogs.valid ? (
            <ValidDialog
              linkPairs={linkPairs}
              onDeleteLinks={(invalidPairs: ImageLinkPair[]) => {
                onDeleteImageList(
                  invalidPairs
                    .filter((pair) => pair.creator.username === userName)
                    .map((pair) => pair.id)
                )
              }}
            />
          ) : dialog === Dialogs.tags ? (
            <TagsDialog
              initialTags={imageInfo.tags}
              imageID={imageInfo.ID}
              imageLink={imageInfo.imageLink}
              description={imageInfo.description}
              onSaveTags={(updateData: UpdateImageTag) => {
                onChangeTags(updateData)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <ImageShareSheet
        imageID={imageInfo.ID}
        imageName={imageInfo.description}
        title="镜像分享"
        description="分享镜像链接到指定的用户或账户"
        isOpen={openShareSheet}
        onOpenChange={setOpenShareSheet}
      ></ImageShareSheet>
    </div>
  )
}
