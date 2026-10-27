export function getStudentImageUrl(studentUid: string): string {
  return `https://assets.baql.net/images/students/collection/${studentUid}.webp`;
}

export function getResourceImageUrl(type: string, uid: string): string {
  const typeMap: Record<string, string> = {
    Item: 'items',
    Currency: 'currencies',
    Equipment: 'equipments',
    Furniture: 'furnitures',
  };
  const dir = typeMap[type] || 'items';
  return `https://assets.baql.net/images/resources/${dir}/${uid}.webp`;
}
