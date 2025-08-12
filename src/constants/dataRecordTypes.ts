export interface AttachmentTypeOption {
  name: string;
  attachmentType: string;
}

export const ATTACHMENT_TYPES: AttachmentTypeOption[] = [
  {
    name: '点云连续帧 (POINTCLOUD_SEQUENCE)',
    attachmentType: 'POINTCLOUD_SEQUENCE'
  },
  {
    name: '图片连续帧 (IMAGE_SEQUENCE)',
    attachmentType: 'IMAGE_SEQUENCE'
  },
];
