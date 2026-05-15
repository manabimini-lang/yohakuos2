import { 
  MoreVertical, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Content } from "@/types";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ContentListProps {
  contents: Content[];
  onEdit: (content: Content) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
}

export function ContentList({ contents, onEdit, onDelete, onTogglePublish }: ContentListProps) {
  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-notion-bg/10">
        <div className="h-16 w-16 rounded-full bg-notion-bg flex items-center justify-center mb-4 text-muted-foreground">
          <Globe className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold">コンテンツが見つかりません</h3>
        <p className="text-muted-foreground max-w-xs mx-auto mt-1">
          検索条件を変えるか、新しいコンテンツを作成してみましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {contents.map((content, idx) => (
        <motion.div
          key={content.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-0 flex h-36">
              <div className="w-1/3 bg-notion-bg relative overflow-hidden flex-shrink-0">
                {content.thumbnail_url ? (
                  <img 
                    src={content.thumbnail_url} 
                    alt={content.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                    <Globe className="h-10 w-10" />
                  </div>
                )}
                {content.is_published ? (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-brand text-white text-[10px] font-bold rounded uppercase tracking-wider">公開中</div>
                ) : (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-gray-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">下書き</div>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand bg-brand/5 px-1.5 py-0.5 rounded border border-brand/10">
                      {content.category}
                    </span>
                    <span className={cn(
                        "flex items-center gap-1 text-[10px] font-medium",
                        content.layer === 'public' ? "text-blue-600" : "text-amber-600"
                    )}>
                      {content.layer === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {content.layer === 'public' ? "全公開" : "メンバー限定"}
                    </span>
                  </div>
                  <h3 className="font-bold text-base leading-tight truncate group-hover:text-brand transition-colors">
                    {content.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {content.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground italic">
                    更新: {new Date(content.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {content.external_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand" asChild>
                            <a href={content.external_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit(content)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>編集する</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTogglePublish(content.id)}>
                          {content.is_published ? (
                              <><EyeOff className="mr-2 h-4 w-4" /><span>下書きに戻す</span></>
                          ) : (
                              <><Eye className="mr-2 h-4 w-4" /><span>公開する</span></>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(content.id)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>削除する</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
