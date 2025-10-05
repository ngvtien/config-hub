// Bitbucket-specific API types
// These types match the Bitbucket Server and Cloud REST API responses

/**
 * Bitbucket Server API response wrapper
 */
export interface BitbucketPagedResponse<T> {
  size: number
  limit: number
  isLastPage: boolean
  values: T[]
  start: number
  nextPageStart?: number
}

/**
 * Bitbucket file/directory entry
 */
export interface BitbucketFile {
  path: {
    components: string[]
    parent: string
    name: string
    extension?: string
    toString: string
  }
  type: 'FILE' | 'DIRECTORY'
  size: number
  contentId?: string
}

/**
 * Bitbucket commit information
 */
export interface BitbucketCommit {
  id: string
  displayId: string
  author: {
    name: string
    emailAddress: string
    displayName?: string
  }
  authorTimestamp: number
  committer?: {
    name: string
    emailAddress: string
    displayName?: string
  }
  committerTimestamp?: number
  message: string
  parents: Array<{ id: string; displayId: string }>
}

/**
 * Bitbucket branch information
 */
export interface BitbucketBranch {
  id: string
  displayId: string
  type: 'BRANCH' | 'TAG'
  latestCommit: string
  latestChangeset: string
  isDefault: boolean
}

/**
 * Bitbucket Pull Request
 */
export interface BitbucketPullRequest {
  id: number
  version: number
  title: string
  description?: string
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED'
  open: boolean
  closed: boolean
  createdDate: number
  updatedDate: number
  fromRef: {
    id: string
    displayId: string
    latestCommit: string
    repository: BitbucketRepository
  }
  toRef: {
    id: string
    displayId: string
    latestCommit: string
    repository: BitbucketRepository
  }
  locked: boolean
  author: {
    user: BitbucketUser
    role: string
    approved: boolean
    status: string
  }
  reviewers: Array<{
    user: BitbucketUser
    role: string
    approved: boolean
    status: 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED'
  }>
  participants: Array<{
    user: BitbucketUser
    role: string
    approved: boolean
    status: string
  }>
  links: {
    self: Array<{ href: string }>
  }
}

/**
 * Bitbucket user information
 */
export interface BitbucketUser {
  name: string
  emailAddress: string
  id: number
  displayName: string
  active: boolean
  slug: string
  type: 'NORMAL' | 'SERVICE'
}

/**
 * Bitbucket repository information
 */
export interface BitbucketRepository {
  slug: string
  id: number
  name: string
  description?: string
  hierarchyId: string
  scmId: string
  state: 'AVAILABLE' | 'INITIALISING' | 'INITIALISATION_FAILED'
  statusMessage?: string
  forkable: boolean
  project: {
    key: string
    id: number
    name: string
    description?: string
    public: boolean
    type: 'NORMAL' | 'PERSONAL'
    links: {
      self: Array<{ href: string }>
    }
  }
  public: boolean
  links: {
    clone: Array<{ href: string; name: string }>
    self: Array<{ href: string }>
  }
}

/**
 * Bitbucket create branch request
 */
export interface BitbucketCreateBranchRequest {
  name: string
  startPoint: string
  message?: string
}

/**
 * Bitbucket commit changes request
 */
export interface BitbucketCommitRequest {
  message: string
  branch: string
  author?: {
    name: string
    email: string
  }
  files: Record<string, string> // path -> content
}

/**
 * Bitbucket create Pull Request request
 */
export interface BitbucketCreatePullRequestRequest {
  title: string
  description?: string
  state?: 'OPEN'
  open?: boolean
  closed?: boolean
  fromRef: {
    id: string
    repository: {
      slug: string
      name?: string
      project: {
        key: string
      }
    }
  }
  toRef: {
    id: string
    repository: {
      slug: string
      name?: string
      project: {
        key: string
      }
    }
  }
  locked?: boolean
  reviewers?: Array<{
    user: {
      name: string
    }
  }>
}

/**
 * Bitbucket merge Pull Request request
 */
export interface BitbucketMergePullRequestRequest {
  version: number
  message?: string
  autoSubject?: boolean
}

/**
 * Bitbucket error response
 */
export interface BitbucketErrorResponse {
  errors: Array<{
    context?: string
    message: string
    exceptionName?: string
  }>
}

/**
 * Bitbucket Cloud API types (different from Server)
 */
export namespace BitbucketCloud {
  export interface Repository {
    type: 'repository'
    full_name: string
    uuid: string
    name: string
    slug: string
    description?: string
    is_private: boolean
    owner: {
      type: 'user' | 'team'
      username: string
      display_name: string
      uuid: string
    }
    workspace: {
      type: 'workspace'
      slug: string
      name: string
      uuid: string
    }
    links: {
      self: { href: string }
      html: { href: string }
      clone: Array<{ href: string; name: string }>
    }
  }

  export interface PullRequest {
    type: 'pullrequest'
    id: number
    title: string
    description?: string
    state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED'
    author: {
      type: 'user'
      username: string
      display_name: string
      uuid: string
    }
    source: {
      branch: { name: string }
      commit: { hash: string }
      repository: Repository
    }
    destination: {
      branch: { name: string }
      commit: { hash: string }
      repository: Repository
    }
    merge_commit?: {
      hash: string
    }
    created_on: string
    updated_on: string
    links: {
      self: { href: string }
      html: { href: string }
    }
    reviewers: Array<{
      type: 'user'
      username: string
      display_name: string
      uuid: string
    }>
  }

  export interface Commit {
    type: 'commit'
    hash: string
    date: string
    author: {
      type: 'author'
      raw: string
      user?: {
        type: 'user'
        username: string
        display_name: string
        uuid: string
      }
    }
    message: string
    parents: Array<{ hash: string; type: 'commit' }>
  }

  export interface Branch {
    type: 'branch'
    name: string
    target: {
      hash: string
      type: 'commit'
    }
  }
}
