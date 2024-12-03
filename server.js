const { error, timeStamp } = require('console');
const express = require('express')
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser')


const app = express();
app.use(cors());
app.use(bodyParser.json());

let posts = {};

app.post('/posts', (req, res) => {
    const { content, parentId = null } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content not found' })
    }

    const postId = uuidv4();
    const newPost = {
        id: postId,
        content,
        timeStamp: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        replies: []
    };

    if (parentId) {
        const parentPost = findPostById(parentId);
        if (!parentPost) {
            return res.status(404).json({ error: 'Parent post not found' })
        }
        parentPost.replies.push(newPost)
    } else {
        posts[postId] = newPost;
    }
    
    console.log(newPost)
    res.status(201).json(newPost);

})


app.get('/posts', (req, res) => {
    const { page = 1, limit = 10, sort = 'timeStamp' } = req.body;

    let rootPosts = Object.values(posts);

    if (sort === 'timeStamp') {
        rootPosts.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))
    }

    const start = (page - 1) * limit;
    const PagePosts = rootPosts.slice(start, start + parseInt(limit))

    res.json({ posts: PagePosts, total: rootPosts.length });
})


app.get('/posts/:id/comments', (req, res) => {
    const { id } = req.params

    const post = findPostById(id);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' })
    }

    res.json({ post });
})

function findPostById(id, postList = posts) {
    for (const key in postList) {
        const post = postList[key];
        if (post.id === id) {
            return post;
        }

        for (const reply of post.replies) {
            const ele = findPostById(id, { [reply.id]: reply })
            if (ele) return ele;
        }
    }

    return null;
}

app.put('/posts/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required.' });
    }

    const post = findPostById(id);
    if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
    }

    post.content = content;
    res.json({ message: 'Post updated.', post });
});

app.delete('/posts/:id', (req, res) => {
    const { id } = req.params;

    if (deletePostById(id)) {
        res.json({ message: 'Post deleted.' });
    } else {
        res.status(404).json({ error: 'Post not found.' });
    }
});

function deletePostById(id, postList = posts) {
    for (const key in postList) {
        const post = postList[key];
        if (post.id === id) {
            delete postList[key];
            return true;
        }

        for (const reply of post.replies) {
            if (deletePostById(id, { [reply.id]: reply })) {
                post.replies = post.replies.filter(r => r.id !== id);
                return true;
            }
        }
    }

    return false;
}

app.post('/posts/:id/reaction', (req, res) => {
    const { id } = req.params;
    const { reaction } = req.body;
  
    const post = findPostById(id);
    if (!post) {
      console.error('Post not found:', id);
      return res.status(404).json({ error: 'Post not found' });
    }
  
    if (reaction === 'like') {
      post.likes += 1;
    } else if (reaction === 'dislike') {
      post.dislikes += 1;
    } else {
      console.error('Invalid reaction type:', reaction);
      return res.status(400).json({ error: 'Invalid reaction type.' });
    }
  
    console.log('Updated post:', post);
    res.json({ message: 'Reaction updated.', post });
  });
  

app.post('/posts/:id/reply', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    const post = findPostById(id);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    const replyId = uuidv4();
    const newReply = {
        id: replyId,
        content,
        timeStamp: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
    };

    post.replies.push(newReply);
    res.status(201).json(newReply);
});



const PORT = 5000;
app.listen(PORT, () => {
    console.log(' Server runnning')
})