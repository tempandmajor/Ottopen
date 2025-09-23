"use client";

import { Navigation } from "@/src/components/navigation";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Search,
  Send,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Image as ImageIcon
} from "lucide-react";
import { useState } from "react";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [newMessage, setNewMessage] = useState("");

  // Mock conversations
  const conversations = [
    {
      id: 1,
      name: "Maya Rodriguez",
      username: "maya_writes",
      lastMessage: "Thanks for the feedback on my latest chapter! I really appreciate your insights.",
      time: "2m ago",
      unread: 2,
      online: true,
      avatar: null
    },
    {
      id: 2,
      name: "James Chen",
      username: "james_screenplay",
      lastMessage: "Would love to collaborate on that screenplay project we discussed.",
      time: "1h ago",
      unread: 0,
      online: true,
      avatar: null
    },
    {
      id: 3,
      name: "Amelia Foster",
      username: "amelia_theatre",
      lastMessage: "The play reading went amazing! Thank you for coming.",
      time: "3h ago",
      unread: 1,
      online: false,
      avatar: null
    },
    {
      id: 4,
      name: "Elena Vasquez",
      username: "elena_poet",
      lastMessage: "Your poetry workshop recommendation was perfect.",
      time: "1d ago",
      unread: 0,
      online: false,
      avatar: null
    },
    {
      id: 5,
      name: "Marcus Thompson",
      username: "marcus_fiction",
      lastMessage: "Can't wait to read your new short story collection!",
      time: "2d ago",
      unread: 0,
      online: true,
      avatar: null
    }
  ];

  // Mock messages for selected conversation
  const messages = [
    {
      id: 1,
      sender: "Maya Rodriguez",
      content: "Hey! I just finished reading your latest excerpt. The dialogue feels so natural and authentic.",
      time: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      sender: "You",
      content: "Thank you so much! I've been working on making the conversations feel more realistic. Your feedback means a lot.",
      time: "10:35 AM",
      isOwn: true
    },
    {
      id: 3,
      sender: "Maya Rodriguez",
      content: "The way you handled the emotional tension between the characters was brilliant. Especially in that coffee shop scene.",
      time: "10:37 AM",
      isOwn: false
    },
    {
      id: 4,
      sender: "You",
      content: "That scene took me weeks to get right! I rewrote it probably 10 times.",
      time: "10:40 AM",
      isOwn: true
    },
    {
      id: 5,
      sender: "Maya Rodriguez",
      content: "Thanks for the feedback on my latest chapter! I really appreciate your insights.",
      time: "Just now",
      isOwn: false
    }
  ];

  const selectedConv = conversations[selectedConversation];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="h-full card-bg card-shadow border-literary-border">
                <CardHeader className="p-4 sm:p-6 border-b border-literary-border">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg sm:text-xl font-semibold">Messages</h2>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      className="pl-10 border-literary-border"
                    />
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {conversations.map((conv, index) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(index)}
                        className={`w-full p-3 rounded-lg text-left transition-colors hover:bg-literary-subtle ${selectedConversation === index ? 'bg-literary-subtle' : ''
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-muted text-foreground font-medium text-sm">
                                {conv.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {conv.online && (
                              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-sm truncate">{conv.name}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">{conv.time}</span>
                                {conv.unread > 0 && (
                                  <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {conv.unread}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{conv.lastMessage}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-full card-bg card-shadow border-literary-border flex flex-col">
                {/* Chat Header */}
                <CardHeader className="p-4 sm:p-6 border-b border-literary-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-muted text-foreground font-medium">
                            {selectedConv.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConv.online && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-medium">{selectedConv.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedConv.online ? 'Online' : `Last seen ${selectedConv.time}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 sm:p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-2xl ${message.isOwn
                              ? 'bg-primary text-primary-foreground ml-2'
                              : 'bg-muted text-foreground mr-2'
                              }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${message.isOwn ? 'text-right' : 'text-left'
                            }`}>
                            {message.time}
                          </p>
                        </div>

                        {!message.isOwn && (
                          <Avatar className="h-6 w-6 order-1 mr-2 mt-auto">
                            <AvatarFallback className="bg-muted text-foreground text-xs">
                              {message.sender.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 sm:p-6 border-t border-literary-border">
                  <div className="flex items-end space-x-2">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="pr-12 border-literary-border min-h-[40px]"
                      />
                      <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="p-2"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}