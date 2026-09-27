import { UserDetail } from "@/features/admin/user-detail";

export default async function AdminUserPage(props: PageProps<"/admin/users/[id]">) {
  const { id } = await props.params;
  return <UserDetail id={id} />;
}
