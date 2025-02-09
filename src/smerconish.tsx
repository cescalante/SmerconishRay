import { ActionPanel, Action, Icon, List } from "@raycast/api";
import axios from "axios";
import { load } from "cheerio";
import { useEffect, useState } from "react";

interface Article {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  accessory: string;
  favicon: string;
}

export default function Command() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchHeadlines = async () => {
      try {
        const response = await axios.get("https://www.smerconish.com/headlines");
        const $ = load(response.data);
        const articles: Article[] = [];

        const fetchFavicon = async (url: string) => {
          try {
            const response = await axios.get(`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`);
            return response.config.url || "";
          } catch (error) {
            console.error("Error fetching favicon:", error);
            return Icon.Globe;
          }
        };

        const promises = $("article.elementor-grid-item")
          .slice(0, 20)
          .map(async (index, element) => {
            const title = $(element).find(".article__title a").text();
            const link = $(element).find(".article__title a").attr("href") || "";
            const description = $(element).find(".article__excerpt").text();
            const image = $(element).find(".article__thumbnail img").attr("src") || "";
            const favicon = await fetchFavicon(link);

            articles.push({
              id: index,
              icon: image || Icon.Bird,
              title,
              subtitle: description,
              accessory: link,
              favicon,
            });
          })
          .get();

        await Promise.all(promises);
        setArticles(articles);
      } catch (error) {
        console.error("Error fetching headlines:", error);
      }
    };

    fetchHeadlines();
  }, []);

  return (
    <List searchBarPlaceholder="Search Smerconish.com/headlines">
      <List.Section title="Smerconish.com/headlines">
        {articles.map((item) => (
          <List.Item
            key={item.id}
            icon={item.favicon}
            title={item.title}
            subtitle={item.subtitle}
            detail={<List.Item.Detail markdown={`![Image](${item.icon})\n\n**${item.title}**\n\n${item.subtitle}`} />}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={item.accessory} />
                <Action.CopyToClipboard content={item.title} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
