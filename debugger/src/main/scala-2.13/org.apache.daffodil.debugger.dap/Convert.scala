/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** This file contains support code for making a majority of Scala shareable between different versions of Scala and
  * Daffodil. The main difference comes in package names, converting certain variables, etc. This file has all the
  * helper code for that for Scala 2.13.
  */

package org.apache.daffodil.debugger.dap

import scala.jdk.CollectionConverters._

object Convert {
  /* As Java wrapper methods */
  def asJavaList[T](scalaList: List[T]): java.util.List[T] = scalaList.asJava
  def asJavaMap[K, V](scalaMap: Map[K, V]): java.util.Map[K, V] = scalaMap.asJava

  /* As Scala wrapper methods */
  def asScalaList[T](javaList: java.util.List[T]): List[T] = javaList.asScala.toList
  def asScalaList[T](scalaSeq: Seq[T]): List[T] = scalaSeq.toList
  def asScalaSet[K, V](javaSet: java.util.Set[java.util.Map.Entry[K, V]]): scala.collection.mutable.Set[(K, V)] =
    javaSet.asScala.map(entry => entry.getKey -> entry.getValue)

  /* Daffodil Maybe wrapper methods */
  def daffodilMaybeToOption[T <: AnyRef](maybe: org.apache.daffodil.lib.util.Maybe[T]): Option[T] = maybe.toOption
}
