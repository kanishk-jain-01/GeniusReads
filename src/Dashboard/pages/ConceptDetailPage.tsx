import React from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ConceptDetailPageProps {
    onBack: () => void;
    onViewSource: (chatId: string) => void;
}

const ConceptDetailPage: React.FC<ConceptDetailPageProps> = ({ onBack, onViewSource }) => {
    const { currentConceptDetail } = useDashboardStore();

    if (!currentConceptDetail) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-slate-500">
                <p>No concept selected.</p>
                <Button variant="link" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const { name, description, tags, sourceChats } = currentConceptDetail;

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950">
            <header className="flex items-center p-4 border-b bg-white dark:bg-slate-900">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold ml-4">{name}</h1>
            </header>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 dark:text-slate-300">{description}</p>
                            {tags && tags.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sources</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-4">This concept was extracted from the following conversations:</p>
                            <ul className="space-y-3">
                                {sourceChats.map(chat => (
                                    <li key={chat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center">
                                            <MessageSquare className="h-5 w-5 mr-3 text-slate-500" />
                                            <div>
                                                <p className="font-semibold">{chat.title}</p>
                                                <p className="text-xs text-slate-500">Relevance: {chat.relevanceScore.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => onViewSource(chat.id)}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            View Chat
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
};

export default ConceptDetailPage; 