import axios from "axios";

export const downloadWhatsAppMedia = async (
  url: string,
  token: string
) => {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return Buffer.from(res.data);
};


