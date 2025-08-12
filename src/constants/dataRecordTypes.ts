export interface AttachmentTypeOption {
  name: string;
  attachmentType: string;
}

export const ATTACHMENT_TYPES: AttachmentTypeOption[] = [
  {
    name: '点云单帧',
    attachmentType: 'POINTCLOUD'
  },
  {
    name: '点云连续帧',
    attachmentType: 'POINTCLOUD_SEQUENCE'
  },
  {
    name: '图片连续帧',
    attachmentType: 'IMAGE_SEQUENCE'
  },
];
