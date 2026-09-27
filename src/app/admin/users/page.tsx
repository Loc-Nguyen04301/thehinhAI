import { UsersList } from "@/features/admin/users-list";

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const { q, page } = await props.searchParams;
  return (
    <UsersList
      query={typeof q === "string" ? q.trim() : ""}
      page={Math.max(1, Number(page) || 1)}
    />
  );
}
