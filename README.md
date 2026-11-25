export default async () => {
  const siteUrl = process.env.URL;
  await fetch(`${siteUrl}/.netlify/functions/generate-report-background`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });
};
