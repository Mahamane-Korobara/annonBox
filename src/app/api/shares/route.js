import { createShareCardRecord } from "@/lib/server/shareCardsStore";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function getRequestOrigin(request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  if (!forwardedHost) return url.origin;
  return `${forwardedProto}://${forwardedHost}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const cardText = formData.get("cardText");
    const shareText = formData.get("shareText");
    const targetUrl = formData.get("targetUrl");
    const isMessage = String(formData.get("isMessage") ?? "") === "true";

    const isUploadLike =
      image &&
      typeof image === "object" &&
      typeof image.arrayBuffer === "function" &&
      typeof image.type === "string" &&
      typeof image.size === "number";

    if (!isUploadLike) {
      return Response.json({ message: "Image requise." }, { status: 400 });
    }
    if (!image.type.startsWith("image/")) {
      return Response.json({ message: "Type d'image invalide." }, { status: 400 });
    }
    if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
      return Response.json({ message: "Taille d'image invalide." }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const record = await createShareCardRecord({
      imageBuffer,
      cardText,
      shareText,
      targetUrl,
      isMessage,
    });

    const origin = getRequestOrigin(request);

    return Response.json({
      data: {
        id: record.id,
        sharePageUrl: `${origin}/share/${record.id}`,
        imageUrl: `${origin}/api/shares/${record.id}/image`,
      },
    });
  } catch (error) {
    console.error("POST /api/shares failed:", error);
    return Response.json(
      { message: "Impossible de préparer le partage." },
      { status: 500 }
    );
  }
}
