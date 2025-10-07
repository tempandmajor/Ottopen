import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/src/lib/database'
import { supabase } from '@/src/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user profile
    const profile = (await dbService.getUser(userId)) as any

    // Get user's posts
    const posts = await dbService.getPosts({ userId, published: true })

    // Get user's comments
    const { data: comments } = await supabase.from('comments').select('*').eq('user_id', userId)

    // Get user's follows
    const following = await dbService.getFollowing(userId)
    const followers = await dbService.getFollowers(userId)

    // Get notification settings
    const notificationSettings = await dbService.getNotificationSettings(userId)

    // Get privacy settings
    const privacySettings = await dbService.getPrivacySettings(userId)

    // Get social links
    const { data: socialLinks } = await supabase
      .from('user_social_links')
      .select('*')
      .eq('user_id', userId)

    // Get activity log
    const { data: activityLog } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000) // Last 1000 activities

    // Compile all data
    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        id: userId,
        email: session.user.email,
        display_name: profile?.display_name,
        username: profile?.username,
        bio: profile?.bio,
        specialty: profile?.specialty,
        location: profile?.location,
        website: profile?.website,
        avatar_url: profile?.avatar_url,
        account_type: profile?.account_type,
        created_at: profile?.created_at,
      },
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        genre: post.genre,
        content_type: post.content_type,
        published: post.published,
        views_count: post.views_count,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
      })),
      comments: comments || [],
      social: {
        following: following.length,
        followers: followers.length,
        following_users: following.map(u => ({
          id: u.id,
          username: u.username,
          display_name: u.display_name,
        })),
        followers_users: followers.map(u => ({
          id: u.id,
          username: u.username,
          display_name: u.display_name,
        })),
      },
      settings: {
        notifications: notificationSettings,
        privacy: privacySettings,
      },
      social_links: socialLinks || [],
      activity_log: activityLog || [],
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ottopen-data-${userId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
