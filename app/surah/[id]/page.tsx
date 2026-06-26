import { SurahReader } from "@/components/site";

export const dynamicParams = true;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurahReader surahId={id} />;
}
